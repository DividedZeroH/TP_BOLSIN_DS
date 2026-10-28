import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { SesionesModule } from './modules/sesiones/sesiones.module';
import { RecepcionBolsinModule } from './modules/recepcion-bolsin/recepcion-bolsin.module';

@Module({
  imports: [DatabaseModule, SesionesModule, RecepcionBolsinModule],
})
export class AppModule {}
