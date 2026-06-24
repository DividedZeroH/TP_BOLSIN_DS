import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CodigoOpcionRecepcion,
  DetalleBolsinVista,
  InicioRecepcion,
  ResultadoRecepcionBolsin,
} from './recepcion-bolsin.modelos';

@Injectable({ providedIn: 'root' })
export class RecepcionBolsinService {
  private readonly baseUrl = 'http://localhost:3000/api/recepciones-bolsines';

  constructor(private readonly http: HttpClient) {}

  iniciar(sesionId: number): Observable<InicioRecepcion> {
    return this.http.get<InicioRecepcion>(`${this.baseUrl}/iniciar`, {
      params: { sesionId },
    });
  }

  tomarBolsin(sesionId: number, bolsinId: number): Observable<DetalleBolsinVista> {
    return this.http.get<DetalleBolsinVista>(`${this.baseUrl}/${bolsinId}`, {
      params: { sesionId },
    });
  }

  confirmar(
    sesionId: number,
    bolsinId: number,
    opcion: CodigoOpcionRecepcion,
  ): Observable<ResultadoRecepcionBolsin> {
    return this.http.post<ResultadoRecepcionBolsin>(
      `${this.baseUrl}/${bolsinId}/confirmar`,
      { sesionId, opcion, confirmacion: true },
    );
  }
}
