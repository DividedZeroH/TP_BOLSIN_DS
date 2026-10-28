import { Injectable } from '@nestjs/common';
import { TipoDocumentacion } from '../entity/tipo-documentacion.entity';

@Injectable()
export class TipoDocumentacionService {
  getNombre(tipo: TipoDocumentacion): string {
    return tipo.nombre;
  }
}
