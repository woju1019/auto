/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Das Modul besteht aus der Klasse {@linkcode AutoWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import {
    type AutoNotExists,
    type CreateError,
    type ModellExists,
    type UpdateError,
    type VersionInvalid,
    type VersionOutdated,
} from './errors.js';
import { type DeleteResult, Repository } from 'typeorm';
import { Auto } from '../entity/auto.entity.js';
import { AutoReadService } from './auto-read.service.js';
import { AutoValidationService } from './auto-validation.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service.js';
import RE2 from 're2';
import { Schlagwort } from '../entity/schlagwort.entity.js';
import { getLogger } from '../../logger/logger.js';
import { v4 as uuid } from 'uuid';

/**
 * Die Klasse `AutoWriteService` implementiert den Anwendungskern für das
 * Schreiben von Autos und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class AutoWriteService {
    private static readonly VERSION_PATTERN = new RE2('^"\\d*"');

    readonly #repo: Repository<Auto>;

    readonly #readService: AutoReadService;

    readonly #validationService: AutoValidationService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(AutoWriteService.name);

    // eslint-disable-next-line max-params
    constructor(
        @InjectRepository(Auto) repo: Repository<Auto>,
        readService: AutoReadService,
        validationService: AutoValidationService,
        mailService: MailService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
        this.#validationService = validationService;
        this.#mailService = mailService;
    }

    /**
     * Ein neues Auto soll angelegt werden.
     * @param auto Das neu abzulegende Auto
     * @returns Die ID des neu angelegten Autos oder im Fehlerfall
     * [CreateError](../types/auto_service_errors.CreateError.html)
     */
    async create(auto: Auto): Promise<CreateError | string> {
        this.#logger.debug('create: auto=%o', auto);
        const validateResult = await this.#validateCreate(auto);
        if (validateResult !== undefined) {
            return validateResult;
        }

        auto.id = uuid(); // eslint-disable-line require-atomic-updates
        auto.schlagwoerter.forEach((schlagwort) => {
            schlagwort.id = uuid();
        });

        // const autoDb: { id:string | undefined; version:number|undefined = await this.#repo.save(auto);
        const autoDb: Auto = await this.#repo.save(auto);
        await this.#sendmail(autoDb);
        return autoDb.id!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    /**
     * Ein vorhandenes Auto soll aktualisiert werden.
     * @param auto Das zu aktualisierende Auto
     * @param id ID des zu aktualisierenden Autos
     * @param version Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     *  oder im Fehlerfall [UpdateError](../types/auto_service_errors.UpdateError.html)
     */
    async update(
        id: string | undefined,
        auto: Auto,
        version: string,
    ): Promise<UpdateError | number> {
        this.#logger.debug(
            'update: id=%s, auto=%o, version=%s',
            id,
            auto,
            version,
        );
        if (id === undefined || !this.#validationService.validateId(id)) {
            this.#logger.debug('update: Keine gueltige ID');
            return { type: 'AutoNotExists', id };
        }

        const validateResult = await this.#validateUpdate(auto, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Auto)) {
            return validateResult;
        }

        const autoNeu = validateResult;
        // statt: const merged = this.#repo.merge(autoNeu, removeIsbnDash(auto));
        const merged = this.#repo.merge(autoNeu);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged); // implizite Transaktion
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    /**
     * Ein Auto wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Autos
     * @returns true, falls das Auto vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(id: string) {
        this.#logger.debug('delete: id=%s', id);
        if (!this.#validationService.validateId(id)) {
            this.#logger.debug('delete: Keine gueltige ID');
            return false;
        }

        const auto = await this.#readService.findById(id);
        if (auto === undefined) {
            return false;
        }

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            // Das Auto zur gegebenen ID asynchron loeschen
            const { schlagwoerter } = auto;
            const schlagwoerterIds: (string | undefined)[] = schlagwoerter.map(
                (schlagwort: Schlagwort) => schlagwort.id,
            );
            const deleteResultSchlagwoerter = await transactionalMgr.delete(
                Schlagwort,
                schlagwoerterIds,
            );
            this.#logger.debug(
                'delete: deleteResultSchlagwoerter=%o',
                deleteResultSchlagwoerter,
            );
            deleteResult = await transactionalMgr.delete(Auto, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateCreate(auto: Auto): Promise<CreateError | undefined> {
        const validateResult = this.#validationService.validate(auto);
        if (validateResult !== undefined) {
            const messages = validateResult;
            this.#logger.debug('#validateCreate: messages=%o', messages);
            return { type: 'ConstraintViolations', messages };
        }

        const { modell } = auto;
        // let autos umgeändert const autos
        const autos = await this.#readService.find({ modell: modell }); // eslint-disable-line object-shorthand
        if (autos.length > 0) {
            return { type: 'ModellExists', modell };
        }

        this.#logger.debug('#validateCreate: ok');
        return undefined;
    }

    async #sendmail(auto: Auto) {
        const subject = `Neues Auto ${auto.id}`;
        const body = `Das Auto mit dem Modell <strong>${auto.modell}</strong> ist angelegt`;
        await this.#mailService.sendmail(subject, body);
    }

    async #validateUpdate(
        auto: Auto,
        id: string,
        versionStr: string,
    ): Promise<Auto | UpdateError> {
        const result = this.#validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        this.#logger.debug(
            '#validateUpdate: auto=%o, version=%s',
            auto,
            version,
        );

        const validateResult = this.#validationService.validate(auto);
        if (validateResult !== undefined) {
            const messages = validateResult;
            this.#logger.debug('#validateUpdate: messages=%o', messages);
            return { type: 'ConstraintViolations', messages };
        }

        const resultModell = await this.#checkModellExists(auto);
        if (resultModell !== undefined && resultModell.id !== id) {
            return resultModell;
        }

        const resultFindById = await this.#findByIdAndCheckVersion(id, version);
        this.#logger.debug('#validateUpdate: %o', resultFindById);
        return resultFindById;
    }

    #validateVersion(version: string | undefined): VersionInvalid | number {
        if (
            version === undefined ||
            !AutoWriteService.VERSION_PATTERN.test(version)
        ) {
            const error: VersionInvalid = { type: 'VersionInvalid', version };
            this.#logger.debug('#validateVersion: VersionInvalid=%o', error);
            return error;
        }

        return Number.parseInt(version.slice(1, -1), 10);
    }

    async #checkModellExists(auto: Auto): Promise<ModellExists | undefined> {
        const { modell } = auto;

        const autos = await this.#readService.find({ modell: modell }); // eslint-disable-line object-shorthand
        if (autos.length > 0) {
            const [gefundenesAuto] = autos;
            const { id } = gefundenesAuto!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            this.#logger.debug('#checkModellExists: id=%s', id);
            return { type: 'ModellExists', modell, id: id! }; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        }

        this.#logger.debug('#checkModellExists: ok');
        return undefined;
    }

    async #findByIdAndCheckVersion(
        id: string,
        version: number,
    ): Promise<Auto | AutoNotExists | VersionOutdated> {
        const autoDb = await this.#readService.findById(id);
        if (autoDb === undefined) {
            const result: AutoNotExists = { type: 'AutoNotExists', id };
            this.#logger.debug('#checkIdAndVersion: AutoNotExists=%o', result);
            return result;
        }

        // nullish coalescing
        const versionDb = autoDb.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        if (version < versionDb) {
            const result: VersionOutdated = {
                type: 'VersionOutdated',
                id,
                version,
            };
            this.#logger.debug(
                '#checkIdAndVersion: VersionOutdated=%o',
                result,
            );
            return result;
        }

        return autoDb;
    }
}
