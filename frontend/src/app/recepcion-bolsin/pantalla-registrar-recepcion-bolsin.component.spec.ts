import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PantallaRegistrarRecepcionBolsin } from './pantalla-registrar-recepcion-bolsin.component';
import { RecepcionBolsinApiService } from './recepcion-bolsin-api.service';
import {
  BolsinVista,
  DetalleBolsinVista,
  InicioRecepcion,
  ResultadoRecepcion,
} from './recepcion-bolsin.modelos';

describe('PantallaRegistrarRecepcionBolsin', () => {
  let fixture: ComponentFixture<PantallaRegistrarRecepcionBolsin>;
  let component: PantallaRegistrarRecepcionBolsin;
  let api: jasmine.SpyObj<RecepcionBolsinApiService>;

  const bolsin: BolsinVista = {
    id: 1,
    fecha: '2026-06-18T12:00:00.000Z',
    numeroBolsin: 'BOL-2026-001',
    numeroPrecinto: 'PREC-001',
    peso: 2.4,
    comisionMedicaOrigen: { id: 2, nombre: 'Comisión origen' },
  };
  const inicio: InicioRecepcion = {
    comisionMedica: { id: 1, nombre: 'Comisión destino' },
    bolsines: [bolsin],
  };
  const detalle: DetalleBolsinVista = {
    id: 1,
    numeroBolsin: 'BOL-2026-001',
    numeroPrecinto: 'PREC-001',
    remitos: [
      {
        id: 1,
        numero: 'REM-2026-001',
        documentaciones: [
          { id: 1, numero: 'DOC-1', tipo: 'Expediente', asunto: 'Evaluación' },
        ],
      },
    ],
    opciones: [
      {
        codigo: 'CONTENIDO_IGUAL',
        descripcion: 'El contenido del bolsín es igual al registrado.',
      },
    ],
  };
  const resultado: ResultadoRecepcion = {
    bolsinId: 1,
    estadoBolsin: 'Recibido',
    estadoRemitos: 'RecibidoYAceptado',
    estadoDocumentaciones: 'Aceptada',
    fechaHora: '2026-06-18T13:00:00.000Z',
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj<RecepcionBolsinApiService>(
      'RecepcionBolsinApiService',
      ['iniciar', 'obtenerDetalle', 'confirmar'],
    );
    api.iniciar.and.returnValue(
      of(inicio) as unknown as ReturnType<RecepcionBolsinApiService['iniciar']>,
    );
    api.obtenerDetalle.and.returnValue(
      of(detalle) as unknown as ReturnType<RecepcionBolsinApiService['obtenerDetalle']>,
    );
    api.confirmar.and.returnValue(
      of(resultado) as unknown as ReturnType<RecepcionBolsinApiService['confirmar']>,
    );

    await TestBed.configureTestingModule({
      imports: [PantallaRegistrarRecepcionBolsin],
      providers: [{ provide: RecepcionBolsinApiService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(PantallaRegistrarRecepcionBolsin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('recorre inicio, selección, opción y confirmación del flujo normal', () => {
    expect(api.iniciar).toHaveBeenCalledWith(1);
    expect(component.comisionMedica?.nombre).toBe('Comisión destino');
    expect(component.bolsines).toEqual([bolsin]);

    component.tomarBolsin(bolsin);
    expect(api.obtenerDetalle).toHaveBeenCalledWith(1, 1);
    expect(component.detalleBolsin).toEqual(detalle);

    component.tomarOpcion(detalle.opciones[0]);
    expect(component.confirmacionPendiente).toBeTrue();
    component.tomarConfirmacion();

    expect(api.confirmar).toHaveBeenCalledWith(1, 1);
    expect(component.resultado).toEqual(resultado);
  });
});
