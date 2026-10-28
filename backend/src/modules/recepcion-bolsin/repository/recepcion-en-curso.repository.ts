import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  RecepcionEnCurso,
  RecepcionesEnCurso,
} from './recepciones-en-curso.repository.interface';

const TTL_MS = 30 * 60 * 1000;

/** En memoria: las recepciones en curso se pierden al reiniciar el backend. */
@Injectable()
export class RecepcionEnCursoRepository implements RecepcionesEnCurso, OnModuleDestroy {
  private readonly recepciones = new Map<string, RecepcionEnCurso>();
  private readonly limpieza = setInterval(() => this.descartarVencidas(), 60 * 1000);

  constructor() {
    // Que el barrido no impida apagar el proceso.
    this.limpieza.unref();
  }

  crear(
    datos: Pick<RecepcionEnCurso, 'sesionId' | 'comisionMedica' | 'bolsines'>,
  ): RecepcionEnCurso {
    const recepcion: RecepcionEnCurso = {
      ...datos,
      id: randomUUID(),
      paso: 'INICIADA',
      creadaEn: new Date(),
    };
    this.recepciones.set(recepcion.id, recepcion);
    return recepcion;
  }

  obtener(id: string): RecepcionEnCurso {
    const recepcion = this.recepciones.get(id);
    if (!recepcion || this.estaVencida(recepcion)) {
      this.recepciones.delete(id);
      throw new NotFoundException('La recepción no existe o venció.');
    }
    return recepcion;
  }

  eliminar(id: string): void {
    this.obtener(id);
    this.recepciones.delete(id);
  }

  onModuleDestroy(): void {
    clearInterval(this.limpieza);
  }

  private estaVencida(recepcion: RecepcionEnCurso): boolean {
    return Date.now() - recepcion.creadaEn.getTime() > TTL_MS;
  }

  private descartarVencidas(): void {
    for (const recepcion of this.recepciones.values()) {
      if (this.estaVencida(recepcion)) {
        this.recepciones.delete(recepcion.id);
      }
    }
  }
}
