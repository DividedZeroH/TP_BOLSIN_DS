import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AmbitoEstado, Estado } from './domain/estado';
import { estadoADominio } from './estado.mapper';
import { EstadoOrmEntity } from './persistence/estado.orm-entity';

@Injectable()
export class EstadoService {
  constructor(
    @InjectRepository(EstadoOrmEntity)
    private readonly estadoRepository: Repository<EstadoOrmEntity>,
  ) {}

  /**
   * Busca un estado del catálogo. Recibe el `manager` de la transacción en
   * curso cuando la consulta forma parte de una escritura.
   */
  async buscarPorNombreYAmbito(
    nombre: string,
    ambito: AmbitoEstado,
    manager?: EntityManager,
  ): Promise<Estado | null> {
    const repositorio = manager?.getRepository(EstadoOrmEntity) ?? this.estadoRepository;
    const estado = await repositorio.findOneBy({ nombre, ambito });
    return estado ? estadoADominio(estado) : null;
  }
}
