import { Inject, Injectable } from '@nestjs/common';
import { Estado, AmbitoEstado } from '../entity/estado.entity';
import { ContextoTransaccion } from '../../../shared/transaction/unidad-de-trabajo.interface';
import {
  ESTADOS_REPOSITORY,
  EstadosRepositoryInterface,
} from '../repository/estados.repository.interface';

@Injectable()
export class EstadoService {
  constructor(
    @Inject(ESTADOS_REPOSITORY) private readonly repository: EstadosRepositoryInterface,
  ) {}
  buscarPorNombreYAmbito(
    nombre: string,
    ambito: AmbitoEstado,
    contexto?: ContextoTransaccion,
  ): Promise<Estado | null> {
    return this.repository.buscarPorNombreYAmbito(nombre, ambito, contexto);
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
