import { Injectable } from '@nestjs/common';
import { Estado } from '../../../catalogo';
import { Empleado } from '../../../identidad';
import { ComisionMedica } from '../../../organizacion';
import { Bolsin } from '../../domain/bolsin';
import { CambioEstadoBolsin } from '../../domain/cambioEstadoBolsin';
import { CambioEstadoDocumentacion } from '../../domain/cambioEstadoDocumentacion';
import { DetalleRemito } from '../../domain/detalleRemito';
import { Documentacion } from '../../domain/documentacion';
import { Remito } from '../../domain/remito';
import { TipoDocumentacion } from '../../domain/tipoDocumentacion';
import { BolsinCompletoRegistro } from './registros/bolsin-completo.registro';
import { ComisionMedicaRegistro } from './registros/comision-medica.registro';
import { EmpleadoConComisionRegistro } from './registros/empleado-con-comision.registro';
import { EstadoRegistro } from './registros/estado.registro';

/**
 * Reconstruye el agregado Bolsin a partir de las filas de Prisma.
 *
 * Es parte del adaptador de persistencia: la capa de aplicación recibe el
 * `Bolsin` ya armado a través del puerto y nunca ve un `*Registro`.
 *
 * Mapea por su cuenta las entidades de otros subdominios (`Estado`, `Empleado`,
 * `ComisionMedica`) desde sus propios registros: las entidades se comparten,
 * las representaciones persistentes no.
 */
@Injectable()
export class BolsinMapper {
  mapearBolsin(registro: BolsinCompletoRegistro): Bolsin {
    const comisionOrigen = this.mapearComisionMedica(registro.comisionMedicaOrigen);
    const comisionDestino = this.mapearComisionMedica(
      registro.comisionMedicaDestino,
    );
    const remitos = registro.remitos.map((remito) =>
      this.mapearRemito(remito, comisionOrigen, comisionDestino),
    );
    const cambios = registro.cambiosEstado.map(
      (cambio) =>
        new CambioEstadoBolsin(
          cambio.id,
          cambio.fechaHoraInicio,
          cambio.fechaHoraFin,
          this.mapearEstado(cambio.estado),
          this.mapearEmpleado(cambio.empleado),
        ),
    );

    return new Bolsin(
      registro.id,
      registro.numeroPrecinto,
      comisionOrigen,
      comisionDestino,
      remitos,
      cambios,
    );
  }

  private mapearComisionMedica(registro: ComisionMedicaRegistro): ComisionMedica {
    return new ComisionMedica(registro.id, registro.nombre);
  }

  private mapearEstado(registro: EstadoRegistro): Estado {
    return new Estado(registro.id, registro.Nombre, registro.Ambito);
  }

  private mapearEmpleado(registro: EmpleadoConComisionRegistro): Empleado {
    return new Empleado(
      registro.id,
      this.mapearComisionMedica(registro.comisionMedica),
      registro.apellido,
      registro.email,
    );
  }

  private mapearRemito(
    registro: BolsinCompletoRegistro['remitos'][number],
    comisionOrigen: ComisionMedica,
    comisionDestino: ComisionMedica,
  ): Remito {
    const detalles = registro.detalles.map((detalle) => {
      const doc = detalle.documentacion;
      const tipo = new TipoDocumentacion(
        doc.tipoDocumentacion.id,
        doc.tipoDocumentacion.nombre,
      );
      const cambios = doc.cambiosEstado.map(
        (cambio) =>
          new CambioEstadoDocumentacion(
            cambio.id,
            cambio.fechaHoraInicio,
            cambio.fechaHoraFin,
            this.mapearEstado(cambio.estado),
            this.mapearEmpleado(cambio.empleado),
          ),
      );
      // El origen de la documentación se asocia con la comisión de origen del bolsín
      return new DetalleRemito(
        detalle.id,
        new Documentacion(doc.id, doc.asunto, tipo, cambios, comisionOrigen),
      );
    });

    return new Remito(
      registro.id,
      registro.Numero,
      this.mapearEstado(registro.estado),
      detalles,
      comisionOrigen,
      comisionDestino,
    );
  }
}
