import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { IdentidadModule } from './modules/identidad/identidad.module';
import { RecepcionBolsinModule } from './modules/recepcion-bolsin/recepcion-bolsin.module';

@Module({
  imports: [DatabaseModule, IdentidadModule, RecepcionBolsinModule],
})
export class AppModule {}
