import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SesionVista } from '../recepcion-bolsin/recepcion-bolsin.modelos';
import { RecepcionBolsinService } from '../recepcion-bolsin/recepcion-bolsin.service';

@Component({
  selector: 'app-panel',
  imports: [CommonModule, RouterLink],
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.css',
})
export class PanelComponent implements OnInit {
  sesion?: SesionVista;
  error = false;

  constructor(private readonly recepcionService: RecepcionBolsinService) {}

  ngOnInit(): void {
    this.recepcionService.comisionDeSesion().subscribe({
      next: (sesion) => (this.sesion = sesion),
      error: () => (this.error = true),
    });
  }
}
