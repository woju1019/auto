/*
 * Copyright (C) 2019 - present Juergen Zimmermann, Hochschule Karlsruhe
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
import { type GenericJsonSchema } from './GenericJsonSchema.js';

export const MAX_RATING = 250_000;

export const jsonSchema: GenericJsonSchema = {
    // naechstes Release: 2021-02-01
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://acme.com/auto.json#',
    title: 'Auto',
    description: 'Eigenschaften eines Autos: Typen und Constraints',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            pattern:
                '^[\\dA-Fa-f]{8}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{12}$',
        },
        version: {
            type: 'number',
            minimum: 0,
        },
        modell: {
            type: 'string',
            pattern: '^\\w.*',
        },
        kilometerstand: {
            type: 'number',
            minimum: 0,
            maximum: MAX_RATING,
        },
        typ: {
            type: 'string',
            enum: ['KLEINWAGEN', 'TRANSPORTER', 'CABRIO', ''],
        },
        marke: {
            type: 'string',
            enum: ['AUDI', 'PORSCHE', 'VW', ''],
        },
        preis: {
            type: 'number',
            minimum: 0,
        },
        baujahr: { type: 'string', format: 'date' },
        schlagwoerter: {
            type: 'array',
            items: { type: 'object' },
        },
        erzeugt: { type: ['string', 'null'] },
        aktualisiert: { type: ['string', 'null'] },
    },
    required: ['modell', 'marke', 'preis'],
    additionalProperties: false,
    errorMessage: {
        properties: {
            version: 'Die Versionsnummer muss mindestens 0 sein.',
            modell: 'Ein Automodell muss mit einem Buchstaben, einer Ziffer oder _ beginnen.',
            kilometerstand:
                'Ein Kilometerstand muss zwischen 0 und 250000 liegen.',
            typ: 'Die Typ eines Autos muss KLEINWAGEN oder TRANSPORTER oder CABRIO sein.',
            marke: 'Die Marke eines Autos muss AUDI oder PORSCHE oder VW sein.',
            preis: 'Der Preis darf nicht negativ sein.',
            baujahr: 'Das Baujahr muss im Format yyyy-MM-dd sein.',
        },
    },
};
