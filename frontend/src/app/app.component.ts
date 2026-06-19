import { Component } from '@angular/core';
import { PantallaRegistrarRecepcionBolsin } from './recepcion-bolsin/pantalla-registrar-recepcion-bolsin.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PantallaRegistrarRecepcionBolsin],
  template: '<app-pantalla-registrar-recepcion-bolsin />',
})
export class AppComponent {}
