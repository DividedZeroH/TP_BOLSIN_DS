import { Module } from '@nestjs/common';
import { RecepcionBolsinModule } from './modules/recepcion-bolsin';

/**
 * Monolito modular: la raíz solo compone subdominios de negocio. Los de
 * soporte (Catálogo, Identidad) los importa quien los necesita, a través de su
 * API pública.
 */
@Module({
  imports: [RecepcionBolsinModule],
})
export class AppModule {}
