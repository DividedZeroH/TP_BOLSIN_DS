import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Documentacion } from './entity/documentacion.entity';
import { CambioEstadoDocumentacion } from './entity/cambio-estado-documentacion.entity';
import { TipoDocumentacion } from './entity/tipo-documentacion.entity';
import { EstadosModule } from '../estados/estados.module';
import { EmpleadosModule } from '../empleados/empleados.module';
import { ComisionesMedicasModule } from '../comisiones-medicas/comisiones-medicas.module';
import { DocumentacionesService } from './service/documentaciones.service';
import { CambioEstadoDocumentacionService } from './service/cambio-estado-documentacion.service';
import { TipoDocumentacionService } from './service/tipo-documentacion.service';
import { DOCUMENTACIONES_REPOSITORY } from './repository/documentaciones.repository.interface';
import { DocumentacionesRepository } from './repository/documentaciones.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Documentacion,
      CambioEstadoDocumentacion,
      TipoDocumentacion,
    ]),
    EstadosModule,
    EmpleadosModule,
    ComisionesMedicasModule,
  ],

  providers: [
    DocumentacionesService,
    CambioEstadoDocumentacionService,
    TipoDocumentacionService,
    { provide: DOCUMENTACIONES_REPOSITORY, useClass: DocumentacionesRepository },
  ],
  exports: [DocumentacionesService],
})
export class DocumentacionesModule {}
