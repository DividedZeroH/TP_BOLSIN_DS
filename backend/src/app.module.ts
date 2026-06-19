import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RecepcionBolsinModule } from './recepcion-bolsin/recepcion-bolsin.module';

@Module({
  imports: [PrismaModule, RecepcionBolsinModule],
})
export class AppModule {}
