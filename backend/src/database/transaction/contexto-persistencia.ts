import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ContextoTransaccion } from '../../shared/transaction/unidad-de-trabajo.interface';

/** Solo repositorios e infraestructura pueden resolver el contexto a TypeORM. */
@Injectable()
export class ContextoPersistencia {
  private readonly managers = new WeakMap<ContextoTransaccion, EntityManager>();

  constructor(private readonly dataSource: DataSource) {}

  obtenerManager(contexto?: ContextoTransaccion): EntityManager {
    if (!contexto) return this.dataSource.manager;
    return this.obtenerManagerTransaccional(contexto);
  }

  obtenerManagerTransaccional(contexto: ContextoTransaccion): EntityManager {
    const manager = this.managers.get(contexto);
    if (!manager) throw new Error('La transacción no está activa.');
    return manager;
  }

  async enTransaccion<T>(
    operacion: (contexto: ContextoTransaccion) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction('READ COMMITTED', async (manager) => {
      const contexto: ContextoTransaccion = Object.freeze({ id: Symbol('transaccion') });
      this.managers.set(contexto, manager);
      try {
        return await operacion(contexto);
      } finally {
        this.managers.delete(contexto);
      }
    });
  }
}
