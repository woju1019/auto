-- Copyright (C) 2022 - present Juergen Zimmermann, Hochschule Karlsruhe
--
-- This program is free software: you can redistribute it and/or modify
-- it under the terms of the GNU General Public License as published by
-- the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU General Public License for more details.
--
-- You should have received a copy of the GNU General Public License
-- along with this program.  If not, see <https://www.gnu.org/licenses/>.

-- https://dev.mysql.com/doc/refman/8.0/en/create-table.html
-- https://dev.mysql.com/doc/refman/8.0/en/data-types.html
-- TypeORM unterstuetzt nicht BINARY(16) fuer UUID
-- https://dev.mysql.com/doc/refman/8.0/en/integer-types.html
-- BOOLEAN = TINYINT(1) mit TRUE, true, FALSE, false
-- https://dev.mysql.com/doc/refman/8.0/en/boolean-literals.html
-- https://dev.mysql.com/doc/refman/8.0/en/date-and-time-types.html
-- TIMESTAMP nur zwischen '1970-01-01 00:00:01' und '2038-01-19 03:14:07'
-- https://dev.mysql.com/doc/refman/8.0/en/date-and-time-types.html
-- https://dev.mysql.com/doc/refman/8.0/en/create-table-check-constraints.html
-- https://dev.mysql.com/blog-archive/mysql-8-0-16-introducing-check-constraint
-- impliziter Index als B-Baum durch UNIQUE

CREATE TABLE IF NOT EXISTS auto (
    id            CHAR(36) NOT NULL PRIMARY KEY,
    version       INT NOT NULL DEFAULT 0,
    modell         VARCHAR(40) UNIQUE NOT NULL,
    kilometerstand        INT NOT NULL CHECK (kilometerstand >= 0 AND kilometerstand <= 250000),
    typ           VARCHAR(12) NOT NULL CHECK (typ = 'KLEINWAGEN' OR typ = 'TRANSPORTER' OR typ = 'CABRIO' ),
    marke        VARCHAR(12) NOT NULL CHECK (marke = 'AUDI' OR marke = 'PORSCHE' OR marke = 'VW' ),
    preis         DECIMAL(8,2) NOT NULL,
    baujahr         DATE,
    erzeugt       DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    aktualisiert  DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP)
) TABLESPACE autospace ROW_FORMAT=COMPACT;
