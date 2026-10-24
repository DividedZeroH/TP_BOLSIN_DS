import { DataSource } from 'typeorm';
import { opcionesBaseDeDatos } from './configuracion';

/** DataSource que usan la CLI de TypeORM (`db:migrate`, `db:revert`) y el seed. */
export default new DataSource(opcionesBaseDeDatos());
