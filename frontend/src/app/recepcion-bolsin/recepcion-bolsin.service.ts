import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CodigoOpcionRecepcion,
  DetalleBolsinVista,
  InicioRecepcion,
  ResultadoRecepcionBolsin,
} from './recepcion-bolsin.modelos';

/**
 * Adaptador de API del frontend: encapsula las llamadas HTTP al backend del CU
 * de recepción de bolsín. Cada método mapea a un endpoint y devuelve un
 * Observable que consumen los componentes.
 */
@Injectable({ providedIn: 'root' })
export class RecepcionBolsinService {
  private readonly baseUrl = 'http://localhost:3000/api/recepciones-bolsines';

  constructor(private readonly http: HttpClient) {}

  /** Inicia el CU: usuario logueado, su comisión y los bolsines a recibir. */
  iniciar(sesionId: number): Observable<InicioRecepcion> {
    return this.http.get<InicioRecepcion>(`${this.baseUrl}/iniciar`, {
      params: { sesionId },
    });
  }

  /** Trae el detalle (remitos y documentación) de un bolsín seleccionado. */
  tomarBolsin(sesionId: number, bolsinId: number): Observable<DetalleBolsinVista> {
    return this.http.get<DetalleBolsinVista>(`${this.baseUrl}/${bolsinId}`, {
      params: { sesionId },
    });
  }

  /** Confirma la recepción del bolsín con la opción elegida del flujo. */
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
