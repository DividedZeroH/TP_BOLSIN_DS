import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
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
  let router: jasmine.SpyObj<Router>;

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
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [RecepcionBolsinComponent],
      providers: [
        { provide: RecepcionBolsinService, useValue: service },
        { provide: Router, useValue: router },
      ],
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
    expect(texto).toContain('Seleccionado');
    expect(texto).not.toContain('ID 16');
    expect(texto).not.toContain('NUMERO');
  }));

  it('permite cambiar la opcion seleccionada', () => {
    component.seleccionarOpcion(OPCION_CONTENIDO_IGUAL);
    component.seleccionarOpcion(OPCION_FALTA_DOCUMENTACION);

    expect(component.opcionSeleccionada).toBe(OPCION_FALTA_DOCUMENTACION);
  });

  it('mantiene cancelar visible desde el inicio y oculta la confirmacion', () => {
    const botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const botonesCancelar = botones.filter(
      (boton) => boton.textContent?.trim() === 'Cancelar',
    );
    const botonConfirmar = botones.find(
      (boton) => boton.textContent?.trim() === 'Confirmar',
    );

    expect(fixture.nativeElement.textContent).not.toContain('Confirmar recepcion');
    expect(botonesCancelar).toHaveSize(1);
    expect(botonConfirmar).toBeUndefined();
    expect(fixture.nativeElement.querySelector('.confirm-panel')).toBeNull();
    expect(fixture.nativeElement.querySelector('.case-cancel-button')).not.toBeNull();
  });

  it('muestra confirmar habilitado cuando se selecciona una situacion', fakeAsync(() => {
    component.seleccionarBolsin(inicio.bolsines[0]);
    tick();
    fixture.detectChanges();

    let botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    let botonConfirmar = botones.find(
      (boton) => boton.textContent?.trim() === 'Confirmar',
    );
    expect(botonConfirmar).toBeUndefined();

    component.seleccionarOpcion(OPCION_CONTENIDO_IGUAL);
    fixture.detectChanges();

    botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    botonConfirmar = botones.find(
      (boton) => boton.textContent?.trim() === 'Confirmar',
    );

    expect(fixture.nativeElement.textContent).toContain('Confirmar recepcion');
    expect(botonConfirmar?.disabled).toBeFalse();
    expect(fixture.nativeElement.querySelector('.confirm-panel')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.confirm-panel')?.textContent).not.toContain(
      'Cancelar',
    );
    expect(fixture.nativeElement.querySelector('.case-cancel-button')).not.toBeNull();
  }));

  it('pide confirmacion antes de cancelar el caso de uso', fakeAsync(() => {
    component.seleccionarBolsin(inicio.bolsines[0]);
    tick();
    component.seleccionarOpcion(OPCION_CONTENIDO_IGUAL);
    component.cancelarCasoUso();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Cancelar caso de uso');
    expect(fixture.nativeElement.textContent).toContain(
      'Desea confirmar la cancelacion del caso de uso?',
    );
    expect(router.navigate).not.toHaveBeenCalled();

    component.rechazarCancelacion();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Cancelar caso de uso');
    expect(router.navigate).not.toHaveBeenCalled();

    component.cancelarCasoUso();
    component.confirmarCancelacion();

    expect(router.navigate).toHaveBeenCalledWith(['/panel']);
  }));

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
