import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sesion } from './domain/sesion';
import { SesionOrmEntity } from './persistence/sesion.orm-entity';
import { RELACIONES_SESION, sesionADominio } from './sesion.mapper';

@Injectable()
export class SesionService {
  constructor(
    @InjectRepository(SesionOrmEntity)
    private readonly sesionRepository: Repository<SesionOrmEntity>,
  ) {}

  async buscarSesion(sesionId: number): Promise<Sesion> {
    const sesion = await this.sesionRepository.findOne({
      where: { id: sesionId },
      relations: RELACIONES_SESION,
    });
    if (!sesion) {
      throw new NotFoundException('No se encontró la sesión indicada.');
    }
    return sesionADominio(sesion);
  }
}
