import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SesionVista } from '../sesion/sesion.modelos';
import { SesionService } from '../sesion/sesion.service';

@Component({
  selector: 'app-panel',
  imports: [CommonModule, RouterLink],
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.css',
})
export class PanelComponent implements OnInit {
  sesion?: SesionVista;
  error = false;

  constructor(private readonly sesionService: SesionService) {}

  ngOnInit(): void {
    this.sesionService.comisionDeSesion().subscribe({
      next: (sesion) => (this.sesion = sesion),
      error: () => (this.error = true),
    });
  }
}
