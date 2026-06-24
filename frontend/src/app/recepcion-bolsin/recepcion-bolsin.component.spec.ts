import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RecepcionBolsinComponent } from './recepcion-bolsin.component';
import {
  DetalleBolsinVista,
  InicioRecepcion,
  OPCION_CONTENIDO_IGUAL,
  OPCION_FALTA_DOCUMENTACION,
} from './recepcion-bolsin.modelos';
import { RecepcionBolsinService } from './recepcion-bolsin.service';

describe('RecepcionBolsinComponent', () => {
  let fixture: ComponentFixture<RecepcionBolsinComponent>;
  let component: RecepcionBolsinComponent;
  let service: jasmine.SpyObj<RecepcionBolsinService>;

  const inicio: InicioRecepcion = {
    usuarioLogueado: { id: 1 },
    comisionMedica: { id: 1, nombre: 'Comision Medica Cordoba' },
    bolsines: [
      {
        id: 6,
        numeroPrecinto: 2,
        comisionMedicaOrigen: { id: 2, nombre: 'Comision Medica Villa Maria' },
      },
    ],
  };

  const detalle: DetalleBolsinVista = {
    id: 6,
    numeroPrecinto: 2,
    remitos: [
      {
        id: 16,
        numero: 3,
        documentaciones: [
          { id: 7, tipo: 'Expediente medico', asunto: 'Solicitud de junta medica' },
        ],
      },
    ],
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<RecepcionBolsinService>(
      'RecepcionBolsinService',
      ['iniciar', 'tomarBolsin', 'confirmar'],
    );
    service.iniciar.and.returnValue(of(inicio));
    service.tomarBolsin.and.returnValue(of(detalle));
    service.confirmar.and.returnValue(
      of({
        bolsinId: 6,
        fechaHora: '2026-06-18T13:00:00.000Z',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [RecepcionBolsinComponent],
      providers: [{ provide: RecepcionBolsinService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecepcionBolsinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('muestra usuario logueado por mail, precinto numerico y sin columnas numero/peso', () => {
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('Usuario logueado: encargado.cordoba@demo.local');
    expect(texto).toContain('2');
    expect(texto).not.toContain('Usuario 1');
    expect(texto).not.toContain('Peso');
    expect(texto).not.toContain('NUMERO');
  });

  it('muestra mensaje cuando no hay bolsines disponibles', () => {
    service.iniciar.and.returnValue(
      of({ ...inicio, bolsines: [] }),
    );
    component.cargarInicio();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay bolsines disponibles.');
  });

  it('muestra remito numerico y documentacion sin columna numero', fakeAsync(() => {
    component.seleccionarBolsin(inicio.bolsines[0]);
    tick();
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Remito 3');
    expect(texto).toContain('Expediente medico');
    expect(texto).not.toContain('ID 16');
    expect(texto).not.toContain('NUMERO');
  }));

  it('permite cambiar la opcion seleccionada', () => {
    component.seleccionarOpcion(OPCION_CONTENIDO_IGUAL);
    component.seleccionarOpcion(OPCION_FALTA_DOCUMENTACION);

    expect(component.opcionSeleccionada).toBe(OPCION_FALTA_DOCUMENTACION);
  });

  it('cancela la confirmacion limpiando la opcion', () => {
    component.seleccionarOpcion(OPCION_CONTENIDO_IGUAL);
    component.cancelarConfirmacion();

    expect(component.opcionSeleccionada).toBeUndefined();
  });

  it('confirma el flujo normal y muestra solo mensaje de exito', fakeAsync(() => {
    component.seleccionarBolsin(inicio.bolsines[0]);
    tick();
    component.seleccionarOpcion(OPCION_CONTENIDO_IGUAL);
    component.confirmarRecepcion();
    tick();
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(service.confirmar).toHaveBeenCalledWith(1, 6, OPCION_CONTENIDO_IGUAL);
    expect(texto).toContain('Recepcion registrada');
    expect(texto).toContain('El registro de recepcion se confirmo correctamente.');
    expect(texto).not.toContain('RecibidoYAceptado');
    expect(texto).not.toContain('Aceptada');
  }));

  it('si el backend falla en flujo normal conserva confirmacion exitosa visual', fakeAsync(() => {
    service.confirmar.and.returnValue(throwError(() => new Error('backend error')));
    component.seleccionarBolsin(inicio.bolsines[0]);
    tick();
    component.seleccionarOpcion(OPCION_CONTENIDO_IGUAL);
    component.confirmarRecepcion();
    tick();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Recepcion registrada');
  }));

  it('registra situaciones alternativas sin enviar al backend', fakeAsync(() => {
    component.seleccionarBolsin(inicio.bolsines[0]);
    tick();
    component.seleccionarOpcion(OPCION_FALTA_DOCUMENTACION);
    component.confirmarRecepcion();
    fixture.detectChanges();

    expect(service.confirmar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Recepcion registrada');
  }));
});
