import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RecepcionBolsinComponent } from './recepcion-bolsin.component';
import {
  BolsinSeleccionado,
  CodigoOpcionRecepcion,
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

  const RECEPCION = '6f1c3f62-6a9b-4c4e-9f7e-1a2b3c4d5e6f';

  const inicio: InicioRecepcion = {
    recepcionId: RECEPCION,
    usuarioLogueado: { id: 1, apellido: 'Perez', email: 'encargado.cordoba@demo.local' },
    comisionMedica: { id: 1, nombre: 'Comision Medica Cordoba' },
    bolsines: [
      {
        id: 6,
        numeroPrecinto: 2,
        comisionMedicaOrigen: { id: 2, nombre: 'Comision Medica Villa Maria' },
      },
    ],
  };

  // Refleja el contrato real del backend: publica las situaciones del
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

  const seleccion: BolsinSeleccionado = {
    bolsin: inicio.bolsines[0],
    documentacion: [
      { id: 7, numeroRemito: 3, tipo: 'Expediente medico', asunto: 'Solicitud de junta medica' },
      { id: 8, numeroRemito: 3, tipo: 'Informe complementario', asunto: 'Resumen de historia' },
      { id: 9, numeroRemito: 4, tipo: 'Expediente medico', asunto: 'Evaluacion de reingreso' },
    ],
    opciones,
  };

  const opcionVista = (codigo: CodigoOpcionRecepcion): OpcionRecepcionVista =>
    opciones.find((opcion) => opcion.codigo === codigo) as OpcionRecepcionVista;

  const botones = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('button'));

  const texto = (): string => fixture.nativeElement.textContent as string;

  function tomarBolsinYOpcion(): void {
    component.seleccionarBolsin(inicio.bolsines[0]);
    component.seleccionarOpcion(opcionVista(OPCION_CONTENIDO_IGUAL));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    service = jasmine.createSpyObj<RecepcionBolsinService>('RecepcionBolsinService', [
      'iniciar',
      'tomarBolsin',
      'tomarOpcion',
      'confirmar',
      'cancelar',
    ]);
    service.iniciar.and.returnValue(of(inicio));
    service.tomarBolsin.and.returnValue(of(seleccion));
    service.tomarOpcion.and.returnValue(
      of({ confirma: true, mensaje: 'Confirma la recepcion del bolsin con precinto 2?' }),
    );
    service.confirmar.and.returnValue(
      of({
        mensaje: 'Se registro la recepcion del bolsin con precinto 2.',
        numeroPrecinto: 2,
        fechaHora: '2026-06-18T13:00:00.000Z',
      }),
    );
    service.cancelar.and.returnValue(of(undefined));
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

  it('muestra usuario, comision y el precinto con formato BOL-2026-NNN', () => {
    expect(texto()).toContain('Usuario logueado: encargado.cordoba@demo.local');
    expect(texto()).toContain('Comision Medica Cordoba');
    expect(texto()).toContain('BOL-2026-002');
  });

  it('muestra mensaje cuando no hay bolsines disponibles', () => {
    service.iniciar.and.returnValue(of({ ...inicio, bolsines: [] }));
    component.cargarInicio();
    fixture.detectChanges();

    expect(texto()).toContain('No hay bolsines disponibles.');
  });

  it('toma el bolsin por precinto en la recepcion en curso y agrupa la documentacion por remito', () => {
    component.seleccionarBolsin(inicio.bolsines[0]);
    fixture.detectChanges();

    expect(service.tomarBolsin).toHaveBeenCalledWith(RECEPCION, 2);
    expect(component.remitos.map((r) => r.numero)).toEqual([3, 4]);
    expect(component.remitos[0].documentaciones).toHaveSize(2);
    expect(texto()).toContain('Remito 3');
    expect(texto()).toContain('Remito 4');
    expect(texto()).toContain('Seleccionado');
  });

  it('toma las situaciones del backend y deshabilita las no implementadas', () => {
    component.seleccionarBolsin(inicio.bolsines[0]);
    fixture.detectChanges();

    expect(component.opcionesRecepcion).toEqual(opciones);
    const noImplementada = botones().find((b) =>
      b.textContent?.includes('No se recibe toda la documentacion'),
    );
    const implementada = botones().find((b) =>
      b.textContent?.includes('El contenido del bolsin es igual al registrado.'),
    );
    expect(noImplementada?.disabled).toBeTrue();
    expect(noImplementada?.textContent).toContain('No implementado');
    expect(implementada?.disabled).toBeFalse();
  });

  it('no envia al backend una situacion no implementada', () => {
    component.seleccionarBolsin(inicio.bolsines[0]);
    component.seleccionarOpcion(opcionVista(OPCION_FALTA_DOCUMENTACION));

    expect(service.tomarOpcion).not.toHaveBeenCalled();
    expect(component.opcionSeleccionada).toBeUndefined();
  });

  it('tomarOpcion muestra el pedido de confirmacion del backend', () => {
    expect(fixture.nativeElement.querySelector('.confirm-panel')).toBeNull();

    tomarBolsinYOpcion();

    expect(service.tomarOpcion).toHaveBeenCalledWith(RECEPCION, OPCION_CONTENIDO_IGUAL);
    expect(texto()).toContain('Confirma la recepcion del bolsin con precinto 2?');
    const confirmar = botones().find((b) => b.textContent?.trim() === 'Confirmar');
    expect(confirmar?.disabled).toBeFalse();
  });

  it('confirma y muestra el mensaje de exito; al aceptar arranca otra recepcion', () => {
    tomarBolsinYOpcion();
    component.confirmarRecepcion();
    fixture.detectChanges();

    expect(service.confirmar).toHaveBeenCalledWith(RECEPCION);
    expect(texto()).toContain('Recepcion registrada');
    expect(texto()).toContain('Se registro la recepcion del bolsin con precinto 2.');

    component.cerrarModal();
    expect(service.iniciar).toHaveBeenCalledTimes(2);
    expect(component.bolsinSeleccionado).toBeUndefined();
  });

  it('si el backend falla informa su mensaje y no da la recepcion por registrada', () => {
    service.confirmar.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'El bolsín ya no está en estado Enviado.' },
          }),
      ),
    );
    tomarBolsinYOpcion();
    component.confirmarRecepcion();
    fixture.detectChanges();

    expect(texto()).toContain('No se pudo confirmar');
    expect(texto()).toContain('El bolsín ya no está en estado Enviado.');
    expect(texto()).not.toContain('Recepcion registrada');
  });

  it('pide confirmacion antes de cancelar; al confirmar borra la recepcion y vuelve al panel', () => {
    component.cancelarCasoUso();
    fixture.detectChanges();
    expect(texto()).toContain('Desea confirmar la cancelacion del caso de uso?');

    component.rechazarCancelacion();
    expect(service.cancelar).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();

    component.cancelarCasoUso();
    component.confirmarCancelacion();
    expect(service.cancelar).toHaveBeenCalledWith(RECEPCION);
    expect(router.navigate).toHaveBeenCalledWith(['/panel']);
  });

  it('vuelve al panel aunque la recepcion ya no exista en el backend', () => {
    service.cancelar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    component.confirmarCancelacion();
    expect(router.navigate).toHaveBeenCalledWith(['/panel']);
  });
});
