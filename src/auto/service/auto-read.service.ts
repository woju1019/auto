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
 * Das Modul besteht aus der Klasse {@linkcode AutoReadService}.
 * @packageDocumentation
 */

import { Auto, type AutoTyp, type Marke } from '../entity/auto.entity.js';
import { AutoValidationService } from './auto-validation.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { QueryBuilder } from './query-builder.js';
import { Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';

export interface Suchkriterien {
    readonly modell?: string;
    readonly kilometerstand?: number;
    readonly typ?: AutoTyp;
    readonly marke?: Marke;
    readonly preis?: number;
    readonly baujahr?: string;
    readonly javascript?: boolean;
    readonly typescript?: boolean;
}

/**
 * Die Klasse `AutoReadService` implementiert das Lesen für Bücher und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class AutoReadService {
    readonly #repo: Repository<Auto>;

    readonly #autoProps: string[];

    readonly #queryBuilder: QueryBuilder;

    readonly #validationService: AutoValidationService;

    readonly #logger = getLogger(AutoReadService.name);

    constructor(
        @InjectRepository(Auto) repo: Repository<Auto>,
        queryBuilder: QueryBuilder,
        validationService: AutoValidationService,
    ) {
        this.#repo = repo;
        const autoDummy = new Auto();
        this.#autoProps = Object.getOwnPropertyNames(autoDummy);
        this.#queryBuilder = queryBuilder;
        this.#validationService = validationService;
    }

    // Rueckgabetyp Promise bei asynchronen Funktionen
    //    ab ES2015
    //    vergleiche Task<> bei C# und Mono<> aus Project Reactor
    // Status eines Promise:
    //    Pending: das Resultat ist noch nicht vorhanden, weil die asynchrone
    //             Operation noch nicht abgeschlossen ist
    //    Fulfilled: die asynchrone Operation ist abgeschlossen und
    //               das Promise-Objekt hat einen Wert
    //    Rejected: die asynchrone Operation ist fehlgeschlagen and das
    //              Promise-Objekt wird nicht den Status "fulfilled" erreichen.
    //              Im Promise-Objekt ist dann die Fehlerursache enthalten.

    /**
     * Ein Auto asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Autos
     * @returns Das gefundene Auto vom Typ [Auto](auto_entity_auto_entity.Auto.html) oder undefined
     *          in einem Promise aus ES2015 (vgl.: Mono aus Project Reactor oder
     *          Future aus Java)
     */
    async findById(id: string) {
        this.#logger.debug('findById: id=%s', id);

        if (!this.#validationService.validateId(id)) {
            this.#logger.debug('findById: Ungueltige ID');
            return;
        }

        // https://typeorm.io/working-with-repository
        // Das Resultat ist undefined, falls kein Datensatz gefunden
        // Lesen: Keine Transaktion erforderlich
        const auto = await this.#queryBuilder.buildId(id).getOne();
        if (auto === null) {
            this.#logger.debug('findById: Kein Auto gefunden');
            return;
        }

        this.#logger.debug('findById: auto=%o', auto);
        return auto;
    }

    /**
     * Autos asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns Ein JSON-Array mit den gefundenen Autos. Ggf. ist das Array leer.
     */
    async find(suchkriterien?: Suchkriterien) {
        this.#logger.debug('find: suchkriterien=%o', suchkriterien);

        // Keine Suchkriterien?
        if (suchkriterien === undefined) {
            return this.#findAll();
        }
        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            return this.#findAll();
        }

        // Falsche Namen fuer Suchkriterien?
        if (!this.#checkKeys(keys)) {
            return [];
        }

        // QueryBuilder https://typeorm.io/select-query-builder
        // Das Resultat ist eine leere Liste, falls nichts gefunden
        // Lesen: Keine Transaktion erforderlich
        const autos = await this.#queryBuilder.build(suchkriterien).getMany();
        this.#logger.debug('find: autos=%o', autos);

        return autos;
    }

    async #findAll() {
        const autos = await this.#repo.find();
        this.#logger.debug('#findAll: alle autos=%o', autos);
        return autos;
    }

    #checkKeys(keys: string[]) {
        // Ist jedes Suchkriterium auch eine Property von Auto oder "schlagwoerter"?
        let validKeys = true;
        keys.forEach((key) => {
            if (
                !this.#autoProps.includes(key) &&
                key !== 'javascript' &&
                key !== 'typescript'
            ) {
                this.#logger.debug(
                    '#find: ungueltiges Suchkriterium "%s"',
                    key,
                );
                validKeys = false;
            }
        });

        return validKeys;
    }
}
