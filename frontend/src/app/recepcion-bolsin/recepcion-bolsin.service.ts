import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BolsinSeleccionado,
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

  iniciar(sesionId = SESION_ID): Observable<InicioRecepcion> {
    return this.http.post<InicioRecepcion>(this.recepciones, { sesionId });
  }

  tomarBolsin(recepcionId: string, numeroPrecinto: number): Observable<BolsinSeleccionado> {
    return this.http.post<BolsinSeleccionado>(`${this.recepciones}/${recepcionId}/bolsin`, {
      numeroPrecinto,
    });
  }

  tomarOpcion(recepcionId: string, codigo: CodigoOpcionRecepcion): Observable<PedidoConfirmacion> {
    return this.http.post<PedidoConfirmacion>(`${this.recepciones}/${recepcionId}/opcion`, {
      codigo,
    });
  }

  confirmar(recepcionId: string): Observable<ResultadoRecepcionBolsin> {
    return this.http.post<ResultadoRecepcionBolsin>(
      `${this.recepciones}/${recepcionId}/confirmacion`,
      {},
    );
  }

  cancelar(recepcionId: string): Observable<void> {
    return this.http.delete<void>(`${this.recepciones}/${recepcionId}`);
  }
}
