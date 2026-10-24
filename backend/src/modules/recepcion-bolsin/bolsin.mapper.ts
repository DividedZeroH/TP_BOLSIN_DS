import { FindOptionsRelations } from 'typeorm';
import { estadoADominio } from '../catalogo/estado.mapper';
import { empleadoADominio } from '../identidad/sesion.mapper';
import { comisionMedicaADominio } from '../organizacion/comision-medica.mapper';
import { Bolsin } from './domain/bolsin';
import { CambioEstadoBolsin } from './domain/cambio-estado-bolsin';
import { CambioEstadoDocumentacion } from './domain/cambio-estado-documentacion';
import { DetalleRemito } from './domain/detalle-remito';
import { Documentacion } from './domain/documentacion';
import { Remito } from './domain/remito';
import { TipoDocumentacion } from './domain/tipo-documentacion';
import { BolsinOrmEntity } from './persistence/bolsin.orm-entity';
import { CambioEstadoBolsinOrmEntity } from './persistence/cambio-estado-bolsin.orm-entity';
import { CambioEstadoDocumentacionOrmEntity } from './persistence/cambio-estado-documentacion.orm-entity';
import { DocumentacionOrmEntity } from './persistence/documentacion.orm-entity';
import { RemitoOrmEntity } from './persistence/remito.orm-entity';

const RESPONSABLE = { comisionMedica: true } as const;

/**
 * Todo lo que forma el agregado Bolsin. Se carga explícitamente en cada
 * consulta: nada de lazy loading.
 */
export const RELACIONES_BOLSIN: FindOptionsRelations<BolsinOrmEntity> = {
  cmOrigen: true,
  cmDestino: true,
  cambiosEstado: { estado: true, responsable: RESPONSABLE },
  remitos: {
    estado: true,
    cmOrigen: true,
    cmDestino: true,
    detalles: {
      documentacion: {
        tipoDocumentacion: true,
        cmOrigen: true,
        cambiosEstado: { estado: true, responsable: RESPONSABLE },
      },
    },
  },
};

function cambioBolsinADominio(orm: CambioEstadoBolsinOrmEntity): CambioEstadoBolsin {
  return new CambioEstadoBolsin(
    orm.id,
    orm.fechaHoraInicio,
    orm.fechaHoraFin,
    estadoADominio(orm.estado),
    empleadoADominio(orm.responsable),
  );
}

function cambioDocumentacionADominio(
  orm: CambioEstadoDocumentacionOrmEntity,
): CambioEstadoDocumentacion {
  return new CambioEstadoDocumentacion(
    orm.id,
    orm.fechaHoraInicio,
    orm.fechaHoraFin,
    estadoADominio(orm.estado),
    empleadoADominio(orm.responsable),
  );
}

function documentacionADominio(orm: DocumentacionOrmEntity): Documentacion {
  return new Documentacion(
    orm.id,
    orm.asunto,
    new TipoDocumentacion(orm.tipoDocumentacion.id, orm.tipoDocumentacion.nombre),
    comisionMedicaADominio(orm.cmOrigen),
    orm.cambiosEstado.map(cambioDocumentacionADominio),
  );
}

function remitoADominio(orm: RemitoOrmEntity): Remito {
  return new Remito(
    orm.id,
    orm.numero,
    estadoADominio(orm.estado),
    orm.detalles.map(
      (detalle) => new DetalleRemito(detalle.id, documentacionADominio(detalle.documentacion)),
    ),
    comisionMedicaADominio(orm.cmOrigen),
    comisionMedicaADominio(orm.cmDestino),
  );
}

/** Requiere la entidad cargada con `RELACIONES_BOLSIN`. */
export function bolsinADominio(orm: BolsinOrmEntity): Bolsin {
  const porId = <T extends { id: number }>(a: T, b: T) => a.id - b.id;
  return new Bolsin(
    orm.id,
    orm.numeroPrecinto,
    comisionMedicaADominio(orm.cmOrigen),
    comisionMedicaADominio(orm.cmDestino),
    [...orm.remitos].sort(porId).map(remitoADominio),
    orm.cambiosEstado.map(cambioBolsinADominio),
  );
}
