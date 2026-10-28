import { Injectable } from '@nestjs/common';
import { EstadoService } from '../../estados/service/estado.service';
import { CambioEstadoBolsin } from '../entity/cambio-estado-bolsin.entity';

@Injectable()
export class CambioEstadoBolsinService {
  constructor(private readonly estadoService: EstadoService) {}

  sosActual(cambio: CambioEstadoBolsin): boolean {
    return cambio.fechaHoraFin === null;
  }

  sosEnviado(cambio: CambioEstadoBolsin): boolean {
    return cambio.fechaHoraFin === null && this.estadoService.sosEnviado(cambio.estado);
  }

  setFechaHoraFin(cambio: CambioEstadoBolsin, fechaHora: Date): void {
    cambio.fechaHoraFin = fechaHora;
  }
}
