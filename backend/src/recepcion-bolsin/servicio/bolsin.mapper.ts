import { Injectable } from '@nestjs/common';
import { Estado } from '../../dominio/estado';
import { Empleado } from '../../dominio/empleado';
import { ComisionMedica } from '../../dominio/comisionMedica';
import { Remito } from '../../dominio/remito';
import { Documentacion } from '../../dominio/documentacion';
import { Bolsin } from '../../dominio/bolsin';
import { CambioEstadoBolsin } from '../../dominio/cambioEstadoBolsin';
import { CambioEstadoDocumentacion } from '../../dominio/cambioEstadoDocumentacion';
import { DetalleRemito } from '../../dominio/detalleRemito';
import { TipoDocumentacion } from '../../dominio/tipoDocumentacion';
import { EstadoRegistro } from '../repositorio/estado.registro';
import { EmpleadoConComisionRegistro } from '../repositorio/empleado-con-comision.registro';
import { BolsinCompletoRegistro } from '../repositorio/bolsin-completo.registro';

/**
 * Pure Fabrication: no existe en el diagrama de dominio, pero concentra todo
 * el mapeo objeto-relacional (registro plano -> clases de dominio) que antes
 * vivía disperso como métodos privados del gestor. Así el Servicio se queda
 * con la lógica del caso de uso (SRP) y este mapper con la traducción
 * de datos persistentes a objetos de dominio.
 */
@Injectable()
export class BolsinMapper {
  mapearEstado(registro: EstadoRegistro): Estado {
    return new Estado(registro.id, registro.Nombre, registro.Ambito);
  }

  mapearEmpleado(registro: EmpleadoConComisionRegistro): Empleado {
    return new Empleado(
      registro.id,
      new ComisionMedica(
        registro.comisionMedica.id,
        registro.comisionMedica.nombre,
      ),
      registro.apellido,
      registro.email,
    );
  }

  /** Convierte la estructura persistente plana en las clases puras del dominio. */
  mapearBolsin(registro: BolsinCompletoRegistro): Bolsin {
    const comisionOrigen = new ComisionMedica(
      registro.comisionMedicaOrigen.id,
      registro.comisionMedicaOrigen.nombre,
    );
    const comisionDestino = new ComisionMedica(
      registro.comisionMedicaDestino.id,
      registro.comisionMedicaDestino.nombre,
    );
    const remitos = registro.remitos.map((remito) => {
      const detalles = remito.detalles.map((detalle) => {
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
        remito.id,
        remito.Numero,
        this.mapearEstado(remito.estado),
        detalles,
        comisionOrigen,
        comisionDestino,
      );
    });
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
}
