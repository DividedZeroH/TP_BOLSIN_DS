import { Inject, Injectable } from '@nestjs/common';
import { Bolsin } from '../entity/bolsin.entity';
import { CambioEstadoBolsin } from '../entity/cambio-estado-bolsin.entity';
import { Remito } from '../../remitos/entity/remito.entity';
import {
  RemitosService,
  DocumentacionEncontrada,
} from '../../remitos/service/remitos.service';
import { Estado } from '../../estados/entity/estado.entity';
import { CambioEstadoBolsinService } from './cambio-estado-bolsin.service';
import { Empleado } from '../../empleados/entity/empleado.entity';
import { ComisionMedica } from '../../comisiones-medicas/entity/comision-medica.entity';
import { ContextoTransaccion } from '../../../shared/transaction/unidad-de-trabajo.interface';
import {
  BOLSINES_REPOSITORY,
  BolsinesRepositoryInterface,
} from '../repository/bolsines.repository.interface';

@Injectable()
export class BolsinesService {
  constructor(
    @Inject(BOLSINES_REPOSITORY) private readonly repository: BolsinesRepositoryInterface,
    private readonly remitosService: RemitosService,
    private readonly cambiosEstado: CambioEstadoBolsinService,
  ) {}
  buscarPorDestino(comisionId: number): Promise<Bolsin[]> {
    return this.repository.buscarPorDestino(comisionId);
  }
  buscarParaActualizar(
    numeroPrecinto: number,
    contexto: ContextoTransaccion,
  ): Promise<Bolsin | null> {
    return this.repository.buscarParaActualizar(numeroPrecinto, contexto);
  }
  guardarCambiosEstado(bolsin: Bolsin, contexto: ContextoTransaccion): Promise<void> {
    return this.repository.guardarCambiosEstado(bolsin, contexto);
  }
  sosEnviado(bolsin: Bolsin): boolean {
    const actual = bolsin.cambiosEstado.find((cambio) =>
      this.cambiosEstado.sosActual(cambio),
    );
    return actual !== undefined && this.cambiosEstado.sosEnviado(actual);
  }
  obtenerTuCMDestino(bolsin: Bolsin): ComisionMedica {
    return bolsin.cmDestino;
  }
  obtenerCMOrigen(bolsin: Bolsin): ComisionMedica {
    return bolsin.cmOrigen;
  }
  getNumeroPrecinto(bolsin: Bolsin): number {
    return bolsin.numeroPrecinto;
  }
  buscarRemitoBolsin(bolsin: Bolsin): Remito[] {
    return bolsin.remitos;
  }
  buscarDocumentacionBolsin(bolsin: Bolsin): DocumentacionEncontrada[] {
    return bolsin.remitos.flatMap((remito) =>
      this.remitosService.buscarDocumentacion(remito),
    );
  }
  getEstadoActual(bolsin: Bolsin): CambioEstadoBolsin | undefined {
    return bolsin.cambiosEstado.find((cambio) => this.cambiosEstado.sosActual(cambio));
  }
  crearCambioEstado(
    bolsin: Bolsin,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): void {
    const cambio = Object.assign(new CambioEstadoBolsin(), {
      bolsinId: bolsin.id,
      estadoId: estado.id,
      estado,
      responsableId: empleado.id,
      responsable: empleado,
      fechaHoraInicio: fechaHora,
      fechaHoraFin: null,
    });
    bolsin.cambiosEstado.push(cambio);
  }
  registrarCambioEstadoBolsin(
    bolsin: Bolsin,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): void {
    const actual = this.getEstadoActual(bolsin);
    if (actual) this.cambiosEstado.setFechaHoraFin(actual, fechaHora);
    this.crearCambioEstado(bolsin, estado, empleado, fechaHora);
  }
  actualizarEstadoRemito(bolsin: Bolsin, estado: Estado): void {
    bolsin.remitos.forEach((remito) =>
      this.remitosService.recibidoAceptado(remito, estado),
    );
  }
  actualizarDocumentacion(
    bolsin: Bolsin,
    estado: Estado,
    empleado: Empleado,
    fechaHora: Date,
  ): void {
    bolsin.remitos.forEach((remito) =>
      this.remitosService.actualizarDocumentacion(remito, estado, empleado, fechaHora),
    );
  }
}
