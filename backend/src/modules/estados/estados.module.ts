import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estado } from './entity/estado.entity';

import { EstadoService } from './service/estado.service';
import { ESTADOS_REPOSITORY } from './repository/estados.repository.interface';
import { EstadosRepository } from './repository/estados.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Estado])],

  providers: [
    EstadoService,
    { provide: ESTADOS_REPOSITORY, useClass: EstadosRepository },
  ],
  exports: [EstadoService],
})
export class EstadosModule {}
