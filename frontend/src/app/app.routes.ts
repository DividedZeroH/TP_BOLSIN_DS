import { Routes } from '@angular/router';
import { PanelControlComponent } from './panel-control/panel-control.component';
import { RecepcionBolsinComponent } from './recepcion-bolsin/recepcion-bolsin.component';

export const routes: Routes = [
  { path: 'panel', component: PanelControlComponent },
  { path: 'recepcion-bolsin', component: RecepcionBolsinComponent },
  { path: '', pathMatch: 'full', redirectTo: 'panel' },
  { path: '**', redirectTo: 'panel' },
];
