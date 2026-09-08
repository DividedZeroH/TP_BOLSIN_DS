import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RecepcionBolsinComponent } from './recepcion-bolsin.component';
import {
  CodigoOpcionRecepcion,
  DetalleBolsinVista,
  InicioRecepcion,
  OPCION_CONTENIDO_IGUAL,
  OPCION_FALTA_DOCUMENTACION,
  OpcionRecepcionVista,
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

  // Refleja el contrato real del backend: publica las cuatro situaciones del
  // analisis y marca cuales estan implementadas.
  const opciones: OpcionRecepcionVista[] = [
    {
      codigo: OPCION_CONTENIDO_IGUAL,
      descripcion: 'El contenido del bolsin es igual al registrado.',
      implementado: true,
    },
    {
      codigo: OPCION_FALTA_DOCUMENTACION,
      descripcion:
        'No se recibe toda la documentacion asociada a los remitos que contiene el bolsin.',
      implementado: false,
    },
  ];

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
    opciones,
  };

  const opcionVista = (codigo: CodigoOpcionRecepcion): OpcionRecepcionVista =>
    opciones.find((opcion) => opcion.codigo === codigo) as OpcionRecepcionVista;

  const botones = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('button'));

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

  it('toma las situaciones del backend y no de una lista propia', fakeAsync(() => {
    component.seleccionarBolsin(inicio.bolsines[0]);
    tick();
    fixture.detectChanges();

    expect(component.opcionesRecepcion).toEqual(opciones);
    expect(fixture.nativeElement.textContent).toContain(
      'El contenido del bolsin es igual al registrado.',
    );
  }));

  it('deshabilita y marca las situaciones no implementadas', fakeAsync(() => {
    component.seleccionarBolsin(inicio.bolsines[0]);
    tick();
    fixture.detectChanges();

    const opcionNoImplementada = botones().find((boton) =>
      boton.textContent?.includes('No se recibe toda la documentacion'),
    );
    const opcionImplementada = botones().find((boton) =>
      boton.textContent?.includes('El contenido del bolsin es igual al registrado.'),
    );

    expect(opcionNoImplementada?.disabled).toBeTrue();
    expect(opcionNoImplementada?.textContent).toContain('No implementado');
    expect(opcionImplementada?.disabled).toBeFalse();
  }));

  it('permite cambiar entre situaciones implementadas e ignora las que no lo estan', () => {
    component.seleccionarOpcion(opcionVista(OPCION_CONTENIDO_IGUAL));
    expect(component.opcionSeleccionada).toBe(OPCION_CONTENIDO_IGUAL);

    component.seleccionarOpcion(opcionVista(OPCION_FALTA_DOCUMENTACION));
    expect(component.opcionSeleccionada).toBe(OPCION_CONTENIDO_IGUAL);
  });

  it('mantiene cancelar visible desde el inicio y oculta la confirmacion', () => {
    const botonesCancelar = botones().filter(
      (boton) => boton.textContent?.trim() === 'Cancelar',
    );
    const botonConfirmar = botones().find(
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

    expect(
      botones().find((boton) => boton.textContent?.trim() === 'Confirmar'),
    ).toBeUndefined();

    component.seleccionarOpcion(opcionVista(OPCION_CONTENIDO_IGUAL));
    fixture.detectChanges();

    const botonConfirmar = botones().find(
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
    component.seleccionarOpcion(opcionVista(OPCION_CONTENIDO_IGUAL));
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
    component.seleccionarOpcion(opcionVista(OPCION_CONTENIDO_IGUAL));
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

  it('si el backend falla informa el error y no da la recepcion por registrada', fakeAsync(() => {
    service.confirmar.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { message: 'No se encontro el bolsin seleccionado.' },
          }),
      ),
    );
    component.seleccionarBolsin(inicio.bolsines[0]);
    tick();
    component.seleccionarOpcion(opcionVista(OPCION_CONTENIDO_IGUAL));
    component.confirmarRecepcion();
    tick();
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('No se pudo confirmar');
    expect(texto).toContain('No se encontro el bolsin seleccionado.');
    expect(texto).not.toContain('Recepcion registrada');
    // El bolsin sigue disponible: no se registro nada.
    expect(component.bolsines).toHaveSize(1);
  }));

  it('no registra ni envia al backend una situacion no implementada', fakeAsync(() => {
    component.seleccionarBolsin(inicio.bolsines[0]);
    tick();
    component.seleccionarOpcion(opcionVista(OPCION_FALTA_DOCUMENTACION));
    component.confirmarRecepcion();
    fixture.detectChanges();

    let texto = fixture.nativeElement.textContent as string;
    expect(component.opcionSeleccionada).toBeUndefined();
    expect(service.confirmar).not.toHaveBeenCalled();
    expect(texto).not.toContain('Recepcion registrada');

    // Guarda defensiva: aun forzando la seleccion, no se confirma ni se
    // informa como registrada.
    component.cerrarModal();
    component.opcionSeleccionada = OPCION_FALTA_DOCUMENTACION;
    component.confirmarRecepcion();
    fixture.detectChanges();

    texto = fixture.nativeElement.textContent as string;
    expect(service.confirmar).not.toHaveBeenCalled();
    expect(texto).toContain('Situacion no implementada');
    expect(texto).not.toContain('Recepcion registrada');
    expect(component.bolsines).toHaveSize(1);
  }));
});
