import { Inject, Injectable } from '@nestjs/common';
import { Estado } from '../entity/estado.entity';
import { ContextoTransaccion } from '../../../shared/transaction/unidad-de-trabajo.interface';
import {
  ESTADOS_REPOSITORY,
  EstadosRepositoryInterface,
} from '../repository/estados.repository.interface';

/**
 * Los nombres y ámbitos del catálogo se comparan solo acá: el resto del
 * sistema pregunta con los predicados `sos...()`.
 */
@Injectable()
export class EstadoService {
  constructor(
    @Inject(ESTADOS_REPOSITORY) private readonly repository: EstadosRepositoryInterface,
  ) {}
  buscarTodos(contexto?: ContextoTransaccion): Promise<Estado[]> {
    return this.repository.buscarTodos(contexto);
  }
  sosEnviado(estado: Estado): boolean {
    return estado.nombre === 'Enviado';
  }
  sosRecibido(estado: Estado): boolean {
    return estado.nombre === 'Recibido';
  }
  sosRecibidoYAceptado(estado: Estado): boolean {
    return estado.nombre === 'RecibidoYAceptado';
  }
  sosAmbitoBolsin(estado: Estado): boolean {
    return estado.ambito === 'BOLSIN';
  }
  sosAmbitoRemito(estado: Estado): boolean {
    return estado.ambito === 'REMITO';
  }
  sosAmbitoDocumentacion(estado: Estado): boolean {
    return estado.ambito === 'DOCUMENTACION';
  }
}
