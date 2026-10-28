import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComisionMedica } from './entity/comision-medica.entity';

import { ComisionesMedicasService } from './service/comisiones-medicas.service';
import { COMISIONES_MEDICAS_REPOSITORY } from './repository/comisiones-medicas.repository.interface';
import { ComisionesMedicasRepository } from './repository/comisiones-medicas.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ComisionMedica])],

  providers: [
    ComisionesMedicasService,
    { provide: COMISIONES_MEDICAS_REPOSITORY, useClass: ComisionesMedicasRepository },
  ],
  exports: [ComisionesMedicasService],
})
export class ComisionesMedicasModule {}
