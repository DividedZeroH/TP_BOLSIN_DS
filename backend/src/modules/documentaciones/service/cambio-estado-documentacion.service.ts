import { Injectable } from '@nestjs/common';
import { CambioEstadoDocumentacion } from '../entity/cambio-estado-documentacion.entity';

@Injectable()
export class CambioEstadoDocumentacionService {
  sosActual(cambio: CambioEstadoDocumentacion): boolean {
    return cambio.fechaHoraFin === null;
  }

  setFechaHoraFin(cambio: CambioEstadoDocumentacion, fechaHora: Date): void {
    cambio.fechaHoraFin = fechaHora;
  }
}
