/**
 * API pública del subdominio Catálogo.
 *
 * Es lo único que otros módulos pueden importar: alcanzar cualquier archivo
 * interno desde afuera está prohibido por el linter y por el test de
 * arquitectura.
 */
export { Estado } from './domain/estado';
export {
  ESTADO_REPOSITORY,
  IEstadoRepository,
} from './application/ports/estado.repository';
export { CatalogoModule } from './catalogo.module';
export { EstadoMapper } from './infrastructure/persistence/prisma/estado.mapper';
// Se expone el adaptador para que otro módulo pueda componerlo dentro de su
// propia transacción (ver `PrismaUnidadDeTrabajo` en recepción de bolsín).
export { PrismaEstadoRepository } from './infrastructure/persistence/prisma/prisma-estado.repository';
