import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bolsin } from './entity/bolsin.entity';
import { CambioEstadoBolsin } from './entity/cambio-estado-bolsin.entity';
import { RemitosModule } from '../remitos/remitos.module';
import { EmpleadosModule } from '../empleados/empleados.module';
import { EstadosModule } from '../estados/estados.module';
import { ComisionesMedicasModule } from '../comisiones-medicas/comisiones-medicas.module';
import { BolsinesService } from './service/bolsines.service';
import { CambioEstadoBolsinService } from './service/cambio-estado-bolsin.service';
import { BOLSINES_REPOSITORY } from './repository/bolsines.repository.interface';
import { BolsinesRepository } from './repository/bolsines.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bolsin, CambioEstadoBolsin]),
    RemitosModule,
    EmpleadosModule,
    EstadosModule,
    ComisionesMedicasModule,
  ],

  providers: [
    BolsinesService,
    CambioEstadoBolsinService,
    { provide: BOLSINES_REPOSITORY, useClass: BolsinesRepository },
  ],
  exports: [BolsinesService],
})
export class BolsinesModule {}
