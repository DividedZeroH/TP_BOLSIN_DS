import { EntityManager, EntityTarget, IsNull, ObjectLiteral } from 'typeorm';

/** Columnas comunes a CambioEstadoBolsin y CambioEstadoDocumentacion. */
interface CambioEstadoPersistible {
  id?: number;
  estadoId: number;
  responsableId: number;
  fechaHoraInicio: Date;
  fechaHoraFin: Date | null;
}

/**
 * Persiste un historial de cambios de estado ya actualizado por el servicio:
 * inserta los cambios nuevos (sin id) y cierra el que dejó de ser el actual.
 * Lo comparten los repositorios de bolsines y de documentaciones.
 *
 * @param duenio la clave foránea al dueño del historial, p. ej. `{ bolsinId }`.
 */
export async function guardarHistorialEstados(
  manager: EntityManager,
  entidad: EntityTarget<ObjectLiteral>,
  cambios: readonly CambioEstadoPersistible[],
  duenio: Record<string, number>,
): Promise<void> {
  for (const cambio of cambios) {
    if (cambio.id === undefined) {
      await manager.insert(entidad, {
        ...duenio,
        estadoId: cambio.estadoId,
        responsableId: cambio.responsableId,
        fechaHoraInicio: cambio.fechaHoraInicio,
        fechaHoraFin: cambio.fechaHoraFin,
      });
    } else if (cambio.fechaHoraFin !== null) {
      await manager.update(
        entidad,
        { id: cambio.id, fechaHoraFin: IsNull() },
        { fechaHoraFin: cambio.fechaHoraFin },
      );
    }
  }
}
