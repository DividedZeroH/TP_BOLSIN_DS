import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Remito } from './entity/remito.entity';
import { DetalleRemito } from './entity/detalle-remito.entity';
import { DocumentacionesModule } from '../documentaciones/documentaciones.module';
import { EstadosModule } from '../estados/estados.module';
import { ComisionesMedicasModule } from '../comisiones-medicas/comisiones-medicas.module';
import { RemitosService } from './service/remitos.service';
import { DetalleRemitoService } from './service/detalle-remito.service';
import { REMITOS_REPOSITORY } from './repository/remitos.repository.interface';
import { RemitosRepository } from './repository/remitos.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Remito, DetalleRemito]),
    DocumentacionesModule,
    EstadosModule,
    ComisionesMedicasModule,
  ],

  providers: [
    RemitosService,
    DetalleRemitoService,
    { provide: REMITOS_REPOSITORY, useClass: RemitosRepository },
  ],
  exports: [RemitosService],
})
export class RemitosModule {}
