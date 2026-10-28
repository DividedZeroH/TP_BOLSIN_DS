import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL, SESION_ID } from '../api';
import { SesionVista } from './sesion.modelos';

/** Consultas sobre la sesión, separadas del flujo de recepción de bolsines. */
@Injectable({ providedIn: 'root' })
export class SesionService {
  constructor(private readonly http: HttpClient) {}

  comisionDeSesion(sesionId = SESION_ID): Observable<SesionVista> {
    return this.http.get<SesionVista>(`${API_URL}/sesiones/${sesionId}/comision-medica`);
  }
}
