import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BolsinSeleccionado,
  BolsinesParaSeleccion,
  CodigoOpcionRecepcion,
  InicioRecepcion,
  PedidoConfirmacion,
  ResultadoRecepcionBolsin,
  SesionVista,
} from './recepcion-bolsin.modelos';

/** No hay autenticación: la pantalla trabaja siempre con la sesión del seed. */
export const SESION_ID = 1;

@Injectable({ providedIn: 'root' })
export class RecepcionBolsinService {
  private readonly api = 'http://localhost:3000/api';
  private readonly recepciones = `${this.api}/recepciones-bolsines`;

  constructor(private readonly http: HttpClient) {}

  comisionDeSesion(sesionId = SESION_ID): Observable<SesionVista> {
    return this.http.get<SesionVista>(`${this.api}/sesiones/${sesionId}/comision-medica`);
  }

  nuevaRecepcionBolsin(sesionId = SESION_ID): Observable<InicioRecepcion> {
    return this.http.post<InicioRecepcion>(this.recepciones, { sesionId });
  }

  consultarBolsinesParaSeleccion(recepcionId: string): Observable<BolsinesParaSeleccion> {
    return this.http.get<BolsinesParaSeleccion>(
      `${this.recepciones}/${recepcionId}/bolsines`,
    );
  }

  tomarBolsin(
    recepcionId: string,
    numeroPrecinto: number,
  ): Observable<BolsinSeleccionado> {
    return this.http.post<BolsinSeleccionado>(
      `${this.recepciones}/${recepcionId}/bolsin`,
      {
        numeroPrecinto,
      },
    );
  }

  tomarOpcion(
    recepcionId: string,
    codigo: CodigoOpcionRecepcion,
  ): Observable<PedidoConfirmacion> {
    return this.http.post<PedidoConfirmacion>(
      `${this.recepciones}/${recepcionId}/opcion`,
      {
        codigo,
      },
    );
  }

  tomarConfirmacion(recepcionId: string): Observable<ResultadoRecepcionBolsin> {
    return this.http.post<ResultadoRecepcionBolsin>(
      `${this.recepciones}/${recepcionId}/confirmacion`,
      {},
    );
  }

  finDelCU(recepcionId: string): Observable<void> {
    return this.http.post<void>(`${this.recepciones}/${recepcionId}/fin`, {});
  }

  cancelar(recepcionId: string): Observable<void> {
    return this.http.delete<void>(`${this.recepciones}/${recepcionId}`);
  }
}
