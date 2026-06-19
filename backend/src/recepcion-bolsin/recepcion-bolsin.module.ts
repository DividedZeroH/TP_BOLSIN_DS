import { Module } from '@nestjs/common';
import { GestorRegistrarRecepcionBolsin } from './gestor-registrar-recepcion-bolsin.service';
import { RecepcionBolsinController } from './recepcion-bolsin.controller';

@Module({
  controllers: [RecepcionBolsinController],
  providers: [GestorRegistrarRecepcionBolsin],
})
export class RecepcionBolsinModule {}
