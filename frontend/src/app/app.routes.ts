import { Routes } from '@angular/router';
import { PanelComponent } from './panel/panel.component';
import { RecepcionBolsinComponent } from './recepcion-bolsin/recepcion-bolsin.component';

export const routes: Routes = [
  { path: 'panel', component: PanelComponent },
  { path: 'recepcion-bolsin', component: RecepcionBolsinComponent },
  { path: '', pathMatch: 'full', redirectTo: 'panel' },
  { path: '**', redirectTo: 'panel' },
];
