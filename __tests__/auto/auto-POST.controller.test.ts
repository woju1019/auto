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

import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type AutoDTO } from '../../src/auto/rest/auto-write.controller.js';
import { HttpStatus } from '@nestjs/common';
import { ID_PATTERN } from '../../src/auto/service/auto-validation.service.js';
import { loginRest } from '../login.js';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const neuesAuto: AutoDTO = {
    modell: 'Testrest',
    kilometerstand: 1,
    typ: 'KLEINWAGEN',
    marke: 'VW',
    preis: 9999.99,
    baujahr: '2022-02-28',
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
};
const neuesAutoInvalid: Record<string, unknown> = {
    modell: '!?$',
    kilometerstand: -1,
    typ: 'UNSICHTBAR',
    marke: 'NO_MARKE',
    preis: 0,
    baujahr: '12345123123',
    schlagwoerter: [],
};
const neuesAutoModellExistiert: AutoDTO = {
    modell: 'Alpha',
    kilometerstand: 1,
    typ: 'TRANSPORTER',
    marke: 'AUDI',
    preis: 9239.99,
    baujahr: '2022-02-28',
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('POST /', () => {
    let client: AxiosInstance;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json', // eslint-disable-line @typescript-eslint/naming-convention
    };

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    // (done?: DoneFn) => Promise<void | undefined | unknown> | void | undefined
    // close(callback?: (err?: Error) => void): this
    afterAll(async () => {
        await shutdownServer();
    });

    test('Neues Auto', async () => {
        // given
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<string> = await client.post(
            '/',
            neuesAuto,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.CREATED);

        const { location } = response.headers as { location: string };

        expect(location).toBeDefined();

        // ObjectID: Muster von HEX-Ziffern
        const indexLastSlash: number = location.lastIndexOf('/');

        expect(indexLastSlash).not.toBe(-1);

        const idStr = location.slice(indexLastSlash + 1);

        expect(idStr).toBeDefined();
        expect(ID_PATTERN.test(idStr)).toBe(true);

        expect(data).toBe('');
    });

    test('Neues Auto mit ungueltigen Daten', async () => {
        // given
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<string> = await client.post(
            '/',
            neuesAutoInvalid,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(data).toEqual(
            expect.arrayContaining([
                'Ein Automodell muss mit einem Buchstaben, einer Ziffer oder _ beginnen.',
                'Ein Kilometerstand muss zwischen 0 und 250000 liegen.',
                'Die Typ eines Autos muss KLEINWAGEN oder TRANSPORTER oder CABRIO sein.',
                'Die Marke eines Autos muss AUDI oder PORSCHE oder VW sein.',
                'Das Baujahr muss im Format yyyy-MM-dd sein.',
            ]),
        );
    });

    test('Neues Auto, aber der Modell existiert bereits', async () => {
        // given
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<string> = await client.post(
            '/',
            neuesAutoModellExistiert,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(data).toEqual(expect.stringContaining('Titel'));
    });

    test('Neues Auto, aber ohne Token', async () => {
        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/',
            neuesAuto,
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    test('Neues Auto, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/',
            neuesAuto,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
});
