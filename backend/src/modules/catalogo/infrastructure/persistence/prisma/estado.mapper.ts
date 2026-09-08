import { Injectable } from '@nestjs/common';
import { Estado } from '../../../domain/estado';
import { EstadoRegistro } from '../registros/estado.registro';

/** Traduce filas del catálogo Estado a entidades de dominio. */
@Injectable()
export class EstadoMapper {
  mapear(registro: EstadoRegistro): Estado {
    return new Estado(registro.id, registro.Nombre, registro.Ambito);
  }
}
