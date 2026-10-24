import { DataSource } from 'typeorm';
import { opcionesBaseDeDatos } from '../src/database/configuracion';
import { sembrar, vaciarTablas } from '../src/database/seeds/seed';

/** Helpers compartidos por los tests de integración y e2e (base `tpi_bolsin_test`). */

function exigirEntornoDeTest(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Los tests vacían tablas: corrélos con NODE_ENV=test (npm test).');
  }
}

/** Aplica las migraciones pendientes con el mismo DataSource que la CLI. */
export async function migrarBaseDeTest(): Promise<void> {
  exigirEntornoDeTest();
  const dataSource = new DataSource({ ...opcionesBaseDeDatos(), entities: [] });
  await dataSource.initialize();
  try {
    await dataSource.runMigrations();
  } finally {
    await dataSource.destroy();
  }
}

/** Deja la base exactamente como la deja `npm run db:seed` sobre una base vacía. */
export async function reiniciarEscenario(dataSource: DataSource): Promise<void> {
  exigirEntornoDeTest();
  await vaciarTablas(dataSource);
  await dataSource.transaction((manager) => sembrar(manager));
}
