import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadoService } from './estado.service';
import { EstadoOrmEntity } from './persistence/estado.orm-entity';

/** Catálogo de estados que comparten Bolsin, Remito y Documentacion. */
@Module({
  imports: [TypeOrmModule.forFeature([EstadoOrmEntity])],
  providers: [EstadoService],
  exports: [EstadoService],
})
export class CatalogoModule {}
