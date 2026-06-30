import { Routes } from '@angular/router';
import { PanelControlComponent } from './panel-control/panel-control.component';
import { RecepcionBolsinComponent } from './recepcion-bolsin/recepcion-bolsin.component';

/**
 * Rutas de la aplicación: `/panel` (pantalla inicial) y `/recepcion-bolsin`
 * (el caso de uso). La ruta vacía y cualquier ruta desconocida redirigen al
 * panel de control.
 */
export const routes: Routes = [
  { path: 'panel', component: PanelControlComponent },
  { path: 'recepcion-bolsin', component: RecepcionBolsinComponent },
  { path: '', pathMatch: 'full', redirectTo: 'panel' },
  { path: '**', redirectTo: 'panel' },
];
