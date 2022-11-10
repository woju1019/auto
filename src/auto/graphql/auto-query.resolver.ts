/*
 * Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
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
import { Args, Query, Resolver } from '@nestjs/graphql';
import { type Auto } from '../entity/auto.entity.js';
import { AutoReadService } from '../service/auto-read.service.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { UseInterceptors } from '@nestjs/common';
import { UserInputError } from 'apollo-server-express';
import { getLogger } from '../../logger/logger.js';

export type AutoDTO = Omit<
    Auto,
    'aktualisiert' | 'erzeugt' | 'schlagwoerter'
> & { schlagwoerter: string[] };
export interface IdInput {
    id: string;
}

@Resolver()
@UseInterceptors(ResponseTimeInterceptor)
export class AutoQueryResolver {
    readonly #service: AutoReadService;

    readonly #logger = getLogger(AutoQueryResolver.name);

    constructor(service: AutoReadService) {
        this.#service = service;
    }

    @Query('auto')
    async findById(@Args() id: IdInput): Promise<AutoDTO> {
        const idStr = id.id;
        this.#logger.debug('findById: id=%s', idStr);

        const auto = await this.#service.findById(idStr);
        if (auto === undefined) {
            // UserInputError liefert Statuscode 200
            // Weitere Error-Klasse in apollo-server-errors:
            // SyntaxError, ValidationError, AuthenticationError, ForbiddenError,
            // PersistedQuery, PersistedQuery
            // https://www.apollographql.com/blog/graphql/error-handling/full-stack-error-handling-with-graphql-apollo
            throw new UserInputError(
                `Es wurde kein Auto mit der ID ${idStr} gefunden.`,
            );
        }
        const autoDTO = this.#toAutoDTO(auto);
        this.#logger.debug('findById: autoDTO=%o', autoDTO);
        return autoDTO;
    }

    @Query('autos')
    async find(@Args() modell: { modell: string } | undefined) {
        const modellStr = modell?.modell;
        this.#logger.debug('find: modell=%s', modellStr);
        const suchkriterium =
            modellStr === undefined ? {} : { modell: modellStr };
        const autos = await this.#service.find(suchkriterium);
        if (autos.length === 0) {
            // UserInputError liefert Statuscode 200
            throw new UserInputError('Es wurden keine Autos gefunden.');
        }

        const autosDTO = autos.map((auto) => this.#toAutoDTO(auto));
        this.#logger.debug('find: autosDTO=%o', autosDTO);
        return autosDTO;
    }

    #toAutoDTO(auto: Auto) {
        const schlagwoerter = auto.schlagwoerter.map(
            (schlagwort) => schlagwort.schlagwort!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        );
        const autoDTO: AutoDTO = {
            id: auto.id,
            version: auto.version,
            modell: auto.modell,
            kilometerstand: auto.kilometerstand,
            typ: auto.typ,
            marke: auto.marke,
            preis: auto.preis,
            baujahr: auto.baujahr,
            schlagwoerter,
        };
        return autoDTO;
    }
}
