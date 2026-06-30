import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Pantalla inicial (panel de control). Muestra el usuario logueado y las
 * opciones disponibles; desde aquí se navega al caso de uso de recepción.
 */
@Component({
  selector: 'app-panel-control',
  imports: [CommonModule, RouterLink],
  templateUrl: './panel-control.component.html',
  styleUrl: './panel-control.component.css',
})
export class PanelControlComponent {
  /** Email del usuario logueado de demostración (sesión 1 de la semilla). */
  readonly usuario = 'encargado.cordoba@demo.local';
}
