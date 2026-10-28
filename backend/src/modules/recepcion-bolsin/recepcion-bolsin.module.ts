import { UsuariosModule } from '../usuarios/usuarios.module';
import { EmpleadosModule } from '../empleados/empleados.module';
import { ComisionesMedicasModule } from '../comisiones-medicas/comisiones-medicas.module';
import { Module } from '@nestjs/common';
import { BolsinesModule } from '../bolsines/bolsines.module';
import { RemitosModule } from '../remitos/remitos.module';
import { DocumentacionesModule } from '../documentaciones/documentaciones.module';
import { SesionesModule } from '../sesiones/sesiones.module';
import { EstadosModule } from '../estados/estados.module';
import { GestorRegistrarRecepcionBolsin } from './service/gestor-registrar-recepcion-bolsin.service';
import { NotificadorCU29Service } from './service/notificador-cu29.service';
import { RecepcionBolsinController } from './controller/recepcion-bolsin.controller';
import { RecepcionEnCursoRepository } from './repository/recepcion-en-curso.repository';
import { RECEPCIONES_EN_CURSO } from './repository/recepciones-en-curso.repository.interface';
@Module({
  imports: [
    BolsinesModule,
    RemitosModule,
    DocumentacionesModule,
    SesionesModule,
    EstadosModule,
    UsuariosModule,
    EmpleadosModule,
    ComisionesMedicasModule,
  ],
  controllers: [RecepcionBolsinController],
  providers: [
    GestorRegistrarRecepcionBolsin,
    NotificadorCU29Service,
    { provide: RECEPCIONES_EN_CURSO, useClass: RecepcionEnCursoRepository },
  ],
})
export class RecepcionBolsinModule {}
