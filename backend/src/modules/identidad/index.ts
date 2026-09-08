/**
 * API pública del subdominio Identidad.
 *
 * Es lo único que otros módulos pueden importar: alcanzar cualquier archivo
 * interno desde afuera está prohibido por el linter y por el test de
 * arquitectura.
 */
export { Sesion } from './domain/sesion';
export { Usuario } from './domain/usuario';
export { Empleado } from './domain/empleado';
export {
  SESION_REPOSITORY,
  ISesionRepository,
} from './application/ports/sesion.repository';
export { IdentidadModule } from './identidad.module';
