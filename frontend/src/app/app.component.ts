import { Component } from '@angular/core';
import { RecepcionBolsinComponent } from './recepcion-bolsin/recepcion-bolsin.component';

@Component({
  selector: 'app-root',
  imports: [RecepcionBolsinComponent],
  template: '<app-recepcion-bolsin />',
})
export class AppComponent {}
