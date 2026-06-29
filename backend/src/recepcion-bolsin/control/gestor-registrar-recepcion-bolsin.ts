import { Injectable } from '@nestjs/common';
import { RecepcionBolsinServicio } from '../servicio/recepcion-bolsin.servicio';
import { RecepcionBolsinPresenter } from './recepcion-bolsin.presenter';
import {
  DetalleBolsinVista,
  InicioRecepcionVista,
  OpcionRecepcion,
  ResultadoRecepcionBolsin,
} from '../recepcion-bolsin.modelos';

/**
 * Clase Control/Gestor del análisis. Coordina los pasos del flujo normal del CU
 * y mantiene la presentación y el negocio en sus capas: delega la lógica en el
 * Servicio y el armado de la respuesta de pantalla en el Presenter. No conoce
 * repositorios, Prisma ni reglas de negocio.
 */
@Injectable()
export class GestorRegistrarRecepcionBolsin {
  constructor(
    private readonly servicio: RecepcionBolsinServicio,
    private readonly presenter: RecepcionBolsinPresenter,
  ) {}

  /** Inicia el CU y presenta usuario, comisión y bolsines enviados a destino. */
  async nuevaRecepcionBolsin(sesionId: number): Promise<InicioRecepcionVista> {
    const { empleado, comision, bolsines } =
      await this.servicio.iniciarRecepcion(sesionId);

    return this.presenter.presentarInicio(empleado, comision, bolsines);
  }

  /** Recupera el agregado seleccionado y prepara la información de pantalla. */
  async tomarBolsin(
    sesionId: number,
    bolsinId: number,
  ): Promise<DetalleBolsinVista> {
    const bolsin = await this.servicio.obtenerBolsinParaRecepcion(
      sesionId,
      bolsinId,
    );

    return this.presenter.presentarDetalle(bolsin);
  }

  /** Confirma la recepción delegando la validación y la transacción en el Servicio. */
  async confirmarRecepcion(
    sesionId: number,
    bolsinId: number,
    opcion: OpcionRecepcion,
    confirmacion: boolean,
  ): Promise<ResultadoRecepcionBolsin> {
    return this.servicio.confirmarRecepcion(
      sesionId,
      bolsinId,
      opcion,
      confirmacion,
    );
  }
}
