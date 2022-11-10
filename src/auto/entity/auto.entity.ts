/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Florian Goebel, Hochschule Karlsruhe
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

// Nest unterstützt verschiedene Werkzeuge fuer OR-Mapping
// https://docs.nestjs.com/techniques/database
//  * TypeORM     https://typeorm.io
//  * Sequelize   https://sequelize.org
//  * Knex        https://knexjs.org

// TypeORM unterstützt die Patterns
//  * "Data Mapper" und orientiert sich an Hibernate (Java), Doctrine (PHP) und Entity Framework (C#)
//  * "Active Record" und orientiert sich an Mongoose (JavaScript)

// TypeORM unterstützt u.a. die DB-Systeme
//  * Postgres
//  * MySQL
//  * Oracle
//  * Microsoft SQL Server
//  * SAP Hana
//  * Cloud Spanner von Google

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { DecimalTransformer } from './decimal-transformer.js';
import { Schlagwort } from './schlagwort.entity.js';

/**
 * Alias-Typ für gültige Strings bei Verlagen.
 * "Enums get compiled in a big monster of JavaScript".
 */
export type Marke = 'AUDI' | 'PORSCHE' | 'VW';

/**
 * Alias-Typ für gültige Strings bei der Art eines Autos.
 */
export type AutoTyp = 'CABRIO' | 'KLEINWAGEN' | 'TRANSPORTER';

/**
 * Entity-Klasse zu einem relationalen Tabelle
 */
// https://typeorm.io/entities
@Entity()
export class Auto {
    @Column('char')
    // https://typeorm.io/entities#primary-columns
    // CAVEAT: zuerst @Column() und erst dann @PrimaryColumn()
    @PrimaryColumn('uuid')
    id: string | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Das Modell', type: String })
    readonly modell!: string; //NOSONAR

    @Column('int')
    @ApiProperty({ example: 9999, type: Number })
    readonly kilometerstand: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'KLEINWAGEN', type: String })
    readonly typ: AutoTyp | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'AUDI', type: String })
    readonly marke!: Marke;

    @Column({ type: 'decimal', transformer: new DecimalTransformer() })
    @ApiProperty({ example: 1, type: Number })
    // statt number ggf. Decimal aus decimal.js analog zu BigDecimal von Java
    readonly preis!: number;

    // das Temporal-API ab ES2022 wird von TypeORM noch nicht unterstuetzt
    @Column('date')
    @ApiProperty({ example: '2021-01-31' })
    readonly baujahr: Date | string | undefined;

    // https://typeorm.io/many-to-one-one-to-many-relations
    // Bei TypeORM gibt es nur bidirektionale Beziehungen, keine gerichteten
    @OneToMany(
        () => Schlagwort,
        (schlagwort): Auto | null | undefined => schlagwort.auto,
        {
            // https://typeorm.io/eager-and-lazy-relations
            // Join beim Lesen durch find-Methoden des Repositories
            eager: true,
            // https://typeorm.io/relations#cascades
            // kaskadierendes INSERT INTO
            cascade: ['insert'],
        },
    )
    @ApiProperty({ example: ['JAVASCRIPT', 'TYPESCRIPT'] })
    readonly schlagwoerter!: Schlagwort[];

    // https://typeorm.io/entities#special-columns
    @CreateDateColumn({ type: 'timestamp' })
    readonly erzeugt: Date | undefined = new Date();

    @UpdateDateColumn({ type: 'timestamp' })
    readonly aktualisiert: Date | undefined = new Date();
}
