import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Componente raíz de la aplicación. Solo aloja el `<router-outlet />` donde se
 * renderizan las pantallas según la ruta activa (panel y recepción de bolsín).
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {}
