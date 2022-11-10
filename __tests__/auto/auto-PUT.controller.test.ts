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
import { type AutoUpdateDTO } from '../../src/auto/rest/auto-write.controller.js';
import { HttpStatus } from '@nestjs/common';
import { loginRest } from '../login.js';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const geaendertesAuto: AutoUpdateDTO = {
    // isbn wird nicht geaendet
    modell: 'Geaendert',
    kilometerstand: 1,
    typ: 'KLEINWAGEN',
    marke: 'PORSCHE',
    preis: 44_444.4,
    baujahr: '2022-02-03',
};
const idVorhanden = '00000000-0000-0000-0000-000000000040';

const geaendertesAutoIdNichtVorhanden: AutoUpdateDTO = {
    modell: 'Nichtvorhanden',
    kilometerstand: 1,
    typ: 'TRANSPORTER',
    marke: 'VW',
    preis: 44.4,
    baujahr: '2022-02-04',
};
const idNichtVorhanden = '99999999-9999-9999-9999-999999999999';

const geaendertesAutoInvalid: Record<string, unknown> = {
    modell: '?!$',
    kilometerstand: -1,
    typ: 'UNSICHTBAR',
    marke: 'NO_VERLAG',
    preis: 0.01,
    baujahr: '12345-123-123',
};

// isbn wird nicht geaendet
const veraltesAuto: AutoUpdateDTO = {
    modell: 'Veraltet',
    kilometerstand: 1,
    typ: 'KLEINWAGEN',
    marke: 'VW',
    preis: 6445.5,
    baujahr: '2022-02-03',
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('PUT /:id', () => {
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
            headers,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Vorhandenes Auto aendern', async () => {
        // given
        const url = `/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaendertesAuto,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NO_CONTENT);
        expect(data).toBe('');
    });

    test('Nicht-vorhandenes Auto aendern', async () => {
        // given
        const url = `/${idNichtVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaendertesAutoIdNichtVorhanden,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);
        expect(data).toBe(
            `Es gibt kein Auto mit der ID "${idNichtVorhanden}".`,
        );
    });

    test('Vorhandenes Auto aendern, aber mit ungueltigen Daten', async () => {
        // given
        const url = `/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaendertesAutoInvalid,
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

    test('Vorhandenes Auto aendern, aber ohne Versionsnummer', async () => {
        // given
        const url = `/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        delete headers['If-Match'];

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaendertesAuto,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_REQUIRED);
        expect(data).toBe('Header "If-Match" fehlt');
    });

    test('Vorhandenes Auto aendern, aber mit alter Versionsnummer', async () => {
        // given
        const url = `/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"-1"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            veraltesAuto,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);
        expect(data).toEqual(expect.stringContaining('Die Versionsnummer'));
    });

    test('Vorhandenes Auto aendern, aber ohne Token', async () => {
        // given
        const url = `/${idVorhanden}`;
        delete headers.Authorization;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaendertesAuto,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    test('Vorhandenes Auto aendern, aber mit falschem Token', async () => {
        // given
        const url = `/${idVorhanden}`;
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaendertesAuto,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
});
