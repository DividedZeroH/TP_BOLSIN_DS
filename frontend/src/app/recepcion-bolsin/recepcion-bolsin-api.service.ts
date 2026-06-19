import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  DetalleBolsinVista,
  InicioRecepcion,
  ResultadoRecepcion,
} from './recepcion-bolsin.modelos';

/** Adaptador técnico del boundary Angular hacia la API NestJS. */
@Injectable({ providedIn: 'root' })
export class RecepcionBolsinApiService {
  private readonly apiUrl = 'http://localhost:3000/api/recepciones-bolsines';

  constructor(private readonly http: HttpClient) {}

  iniciar(sesionId: number) {
    return this.http.get<InicioRecepcion>(`${this.apiUrl}/iniciar`, {
      params: { sesionId },
    });
  }

  obtenerDetalle(
    sesionId: number,
    bolsinId: number,
  ) {
    return this.http.get<DetalleBolsinVista>(`${this.apiUrl}/${bolsinId}`, {
      params: { sesionId },
    });
  }

  confirmar(
    sesionId: number,
    bolsinId: number,
  ) {
    return this.http.post<ResultadoRecepcion>(
      `${this.apiUrl}/${bolsinId}/confirmar`,
      {
        sesionId,
        opcion: 'CONTENIDO_IGUAL',
        confirmacion: true,
      },
    );
  }
}
