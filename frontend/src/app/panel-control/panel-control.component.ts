import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-panel-control',
  imports: [CommonModule, RouterLink],
  templateUrl: './panel-control.component.html',
  styleUrl: './panel-control.component.css',
})
export class PanelControlComponent {
  readonly usuario = 'encargado.cordoba@demo.local';
}
