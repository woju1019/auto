/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
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

import { type GraphQLRequest, type GraphQLResponse } from 'apollo-server-types';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type AutoDTO } from '../../src/auto/graphql/auto-query.resolver.js';
import { HttpStatus } from '@nestjs/common';
import each from 'jest-each';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = [
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
];

const modellVorhanden = ['Alpha', 'Beta', 'Gamma'];

const teilModellVorhanden = ['a', 't', 'g'];

const teilModellNichtVorhanden = ['Xyz', 'abc'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Queries', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    each(idVorhanden).test('Auto zu vorhandener ID %s', async (id: string) => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    auto(id: "${id}") {
                        modell
                        typ
                        version
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { auto } = data.data!;
        const result: AutoDTO = auto;

        expect(result.modell).toMatch(/^\w/u);
        expect(result.version).toBeGreaterThan(-1);
        expect(result.id).toBeUndefined();
    });

    test('Auto zu nicht-vorhandener ID', async () => {
        // given
        const id = '999999999999999999999999';
        const body: GraphQLRequest = {
            query: `
                {
                    auto(id: "${id}") {
                        modell
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.auto).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error!;

        expect(message).toBe(`Es wurde kein Auto mit der ID ${id} gefunden.`);
        expect(path).toBeDefined();
        expect(path!![0]).toBe('auto');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    each(modellVorhanden).test(
        'Auto zu vorhandenem Modell %s',
        async (modell: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        autos(modell: "${modell}") {
                            modell
                            typ
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.errors).toBeUndefined();

            expect(data.data).toBeDefined();

            const { autos } = data.data!;

            expect(autos).not.toHaveLength(0);

            const autosArray: AutoDTO[] = autos;

            expect(autosArray).toHaveLength(1);

            const [auto] = autosArray;

            expect(auto!.modell).toBe(modell);
        },
    );

    each(teilModellVorhanden).test(
        'AUto zu vorhandenem Teil-Modell %s',
        async (teilModell: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        autos(modell: "${teilModell}") {
                            modell
                            typ
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.errors).toBeUndefined();
            expect(data.data).toBeDefined();

            const { autos } = data.data!;

            expect(autos).not.toHaveLength(0);

            const autosArray: AutoDTO[] = autos;
            autosArray
                .map((auto) => auto.modell)
                .forEach((modell: string) =>
                    expect(modell.toLowerCase()).toEqual(
                        expect.stringContaining(teilModell),
                    ),
                );
        },
    );

    each(teilModellNichtVorhanden).test(
        'Auto zu nicht vorhandenem Modell %s',
        async (teilModell: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        autos(modell: "${teilModell}") {
                            modell
                            typ
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.data!.autos).toBeNull();

            const { errors } = data;

            expect(errors).toHaveLength(1);

            const [error] = errors!;
            const { message, path, extensions } = error!;

            expect(message).toBe('Es wurden keine Autos gefunden.');
            expect(path).toBeDefined();
            expect(path!![0]).toBe('autos');
            expect(extensions).toBeDefined();
            expect(extensions!.code).toBe('BAD_USER_INPUT');
        },
    );
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
