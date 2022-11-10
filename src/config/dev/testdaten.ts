/* eslint-disable @typescript-eslint/no-non-null-assertion */
/*
 * Copyright (C) 2020 - present Juergen Zimmermann, Hochschule Karlsruhe
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
import { type Auto } from '../../auto/entity/auto.entity.js';
import { type Schlagwort } from './../../auto/entity/schlagwort.entity.js';

// TypeORM kann keine SQL-Skripte ausfuehren

export const autos: Auto[] = [
    // -------------------------------------------------------------------------
    // L e s e n
    // -------------------------------------------------------------------------
    {
        id: '00000000-0000-0000-0000-000000000001',
        version: 0,
        modell: 'Alpha',
        kilometerstand: 4,
        typ: 'KLEINWAGEN',
        marke: 'AUDI',
        preis: 5134.1,
        baujahr: new Date('2022-02-01'),
        // "Konzeption und Realisierung eines aktiven Datenbanksystems"
        schlagwoerter: [],
        erzeugt: new Date('2022-02-01'),
        aktualisiert: new Date('2022-02-01'),
    },
    {
        id: '00000000-0000-0000-0000-000000000002',
        version: 0,
        modell: 'Beta',
        kilometerstand: 2,
        typ: 'TRANSPORTER',
        marke: 'VW',
        preis: 7333.2,
        baujahr: new Date('2022-02-02'),
        // "Verteilte Komponenten und Datenbankanbindung"
        schlagwoerter: [],
        erzeugt: new Date('2022-02-02'),
        aktualisiert: new Date('2022-02-02'),
    },
    {
        id: '00000000-0000-0000-0000-000000000003',
        version: 0,
        modell: 'Gamma',
        kilometerstand: 1,
        typ: 'KLEINWAGEN',
        marke: 'AUDI',
        preis: 3443.3,
        baujahr: new Date('2022-02-03'),
        // "Design Patterns"
        schlagwoerter: [],
        erzeugt: new Date('2022-02-03'),
        aktualisiert: new Date('2022-02-03'),
    },
    // -------------------------------------------------------------------------
    // A e n d e r n
    // -------------------------------------------------------------------------
    {
        id: '00000000-0000-0000-0000-000000000040',
        version: 0,
        modell: 'Delta',
        kilometerstand: 3,
        typ: 'TRANSPORTER',
        marke: 'VW',
        preis: 11_114.4,
        baujahr: new Date('2022-02-04'),
        schlagwoerter: [],
        erzeugt: new Date('2022-02-04'),
        aktualisiert: new Date('2022-02-04'),
    },
    // -------------------------------------------------------------------------
    // L o e s c h e n
    // -------------------------------------------------------------------------
    {
        id: '00000000-0000-0000-0000-000000000050',
        version: 0,
        modell: 'Epsilon',
        kilometerstand: 2,
        typ: 'CABRIO',
        marke: 'PORSCHE',
        preis: 20_005.5,
        baujahr: new Date('2022-02-05'),
        schlagwoerter: [],
        erzeugt: new Date('2022-02-05'),
        aktualisiert: new Date('2022-02-05'),
    },
    {
        id: '00000000-0000-0000-0000-000000000060',
        version: 0,
        modell: 'Phi',
        kilometerstand: 2,
        typ: 'KLEINWAGEN',
        marke: 'VW',
        preis: 6336.6,
        baujahr: new Date('2022-02-06'),
        // "Software pioneers",
        schlagwoerter: [],
        erzeugt: new Date('2022-02-06'),
        aktualisiert: new Date('2022-02-06'),
    },
];

export const schlagwoerter: Schlagwort[] = [
    {
        id: '00000000-0000-0000-0000-010000000001',
        auto: autos[0],
        schlagwort: 'JAVASCRIPT',
    },
    {
        id: '00000000-0000-0000-0000-020000000001',
        auto: autos[1],
        schlagwort: 'TYPESCRIPT',
    },
    {
        id: '00000000-0000-0000-0000-030000000001',
        auto: autos[2],
        schlagwort: 'JAVASCRIPT',
    },
    {
        id: '00000000-0000-0000-0000-030000000002',
        auto: autos[2],
        schlagwort: 'TYPESCRIPT',
    },
    {
        id: '00000000-0000-0000-0000-500000000001',
        auto: autos[4],
        schlagwort: 'TYPESCRIPT',
    },
    {
        id: '00000000-0000-0000-0000-600000000001',
        auto: autos[5],
        schlagwort: 'TYPESCRIPT',
    },
];

autos[0]!.schlagwoerter.push(schlagwoerter[0]!);
autos[1]!.schlagwoerter.push(schlagwoerter[1]!);
autos[2]!.schlagwoerter.push(schlagwoerter[2]!, schlagwoerter[3]!);
autos[4]!.schlagwoerter.push(schlagwoerter[4]!);
autos[5]!.schlagwoerter.push(schlagwoerter[5]!);

/* eslint-enable @typescript-eslint/no-non-null-assertion */
