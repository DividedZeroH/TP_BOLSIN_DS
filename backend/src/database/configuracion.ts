import { config } from 'dotenv';
import { join, resolve } from 'path';
import type { DataSourceOptions } from 'typeorm';

// El `.env` vive en la raíz del monorepo (src/database -> ../../../). Las
// variables ya exportadas (por ejemplo en CI) tienen prioridad.
config({ path: resolve(__dirname, '../../../.env') });

/** Los tests (`NODE_ENV=test`) usan siempre la base `tpi_bolsin_test`. */
export function urlBaseDeDatos(): string {
  const variable = process.env.NODE_ENV === 'test' ? 'TEST_DATABASE_URL' : 'DATABASE_URL';
  const url = process.env[variable];
  if (!url) {
    throw new Error(
      `Falta ${variable}. Copiá .env.example a .env y levantá Postgres con "npm run db:up".`,
    );
  }
  return url;
}

// TypeORM resuelve los globs con barras normales, también en Windows.
const glob = (...partes: string[]) => join(...partes).replace(/\\/g, '/');

/**
 * Opciones compartidas por la CLI/seed (`data-source.ts`) y por la app
 * (`DatabaseModule`). El esquema cambia solo con migraciones.
 */
export function opcionesBaseDeDatos(): DataSourceOptions {
  return {
    type: 'postgres',
    url: urlBaseDeDatos(),
    entities: [glob(__dirname, '../modules/**/persistence/*.orm-entity.{ts,js}')],
    migrations: [glob(__dirname, 'migrations/*.{ts,js}')],
    synchronize: false,
  };
}
