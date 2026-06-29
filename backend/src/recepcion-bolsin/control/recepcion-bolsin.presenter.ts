import { Injectable } from '@nestjs/common';
import { Empleado } from '../../dominio/empleado';
import { ComisionMedica } from '../../dominio/comisionMedica';
import { Bolsin } from '../../dominio/bolsin';
import { BolsinResumenRegistro } from '../repositorio/bolsin-resumen.registro';
import {
  DetalleBolsinVista,
  InicioRecepcionVista,
  OPCION_CONTENIDO_IGUAL,
} from '../recepcion-bolsin.modelos';

/**
 * Output mapper (Pure Fabrication): traduce las entidades de dominio a los
 * objetos de presentación que consume la pantalla. Vive en la capa de Control
 * porque la presentación es responsabilidad de la frontera, no del Servicio.
 */
@Injectable()
export class RecepcionBolsinPresenter {
  /** Pantalla inicial: usuario logueado, su comisión y los bolsines enviados. */
  presentarInicio(
    empleado: Empleado,
    comision: ComisionMedica,
    bolsines: BolsinResumenRegistro[],
  ): InicioRecepcionVista {
    return {
      usuarioLogueado: {
        id: empleado.id,
        apellido: empleado.apellido,
        email: empleado.email,
      },
      comisionMedica: { id: comision.id, nombre: comision.getNombre() },
      bolsines: bolsines.map((bolsin) => ({
        id: bolsin.id,
        numeroPrecinto: bolsin.numeroPrecinto,
        comisionMedicaOrigen: bolsin.comisionMedicaOrigen,
      })),
    };
  }

  /** Detalle del bolsín seleccionado con sus remitos, documentación y opciones. */
  presentarDetalle(bolsin: Bolsin): DetalleBolsinVista {
    return {
      id: bolsin.id,
      numeroPrecinto: bolsin.getNumeroPrecinto(),
      remitos: bolsin.buscarRemitoBolsin().map((remito) => ({
        id: remito.id,
        numero: remito.getNumero(),
        documentaciones: remito.buscarDocumentacion().map((documentacion) => ({
          id: documentacion.id,
          tipo: documentacion.mostrarTipoDocumentacion(),
          asunto: documentacion.getAsunto(),
        })),
      })),
      opciones: [
        {
          codigo: OPCION_CONTENIDO_IGUAL,
          descripcion: 'El contenido del bolsín es igual al registrado.',
        },
      ],
    };
  }
}
