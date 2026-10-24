import { Estado } from '../../catalogo/domain/estado';
import { Empleado } from '../../identidad/domain/empleado';
import { ComisionMedica } from '../../organizacion/domain/comision-medica';
import { Bolsin } from './bolsin';
import { CambioEstadoBolsin } from './cambio-estado-bolsin';
import { CambioEstadoDocumentacion } from './cambio-estado-documentacion';
import { DetalleRemito } from './detalle-remito';
import { Documentacion } from './documentacion';
import { Remito } from './remito';
import { TipoDocumentacion } from './tipo-documentacion';

const destino = new ComisionMedica(1, 'Comisión Médica Córdoba');
const origen = new ComisionMedica(2, 'Comisión Médica Villa María');
const empleado = new Empleado(1, destino, 'Pérez', 'encargado@demo.local');

const enviadoBolsin = new Estado(1, 'Enviado', 'BOLSIN');
const recibidoBolsin = new Estado(2, 'Recibido', 'BOLSIN');
const enviadoRemito = new Estado(3, 'Enviado', 'REMITO');
const recibidoYAceptado = new Estado(4, 'RecibidoYAceptado', 'REMITO');
const enBolsinEnviado = new Estado(5, 'EnBolsinEnviado', 'DOCUMENTACION');
const aceptada = new Estado(6, 'Aceptada', 'DOCUMENTACION');

const ayer = new Date('2026-06-18T12:00:00.000Z');
const hoy = new Date('2026-06-19T12:00:00.000Z');

function crearDocumentacion(id: number): Documentacion {
  return new Documentacion(
    id,
    `Asunto ${id}`,
    new TipoDocumentacion(1, 'Expediente médico'),
    origen,
    [new CambioEstadoDocumentacion(id, ayer, null, enBolsinEnviado, empleado)],
  );
}

function crearBolsin(cambios: CambioEstadoBolsin[]): Bolsin {
  const remito = new Remito(
    1,
    1,
    enviadoRemito,
    [new DetalleRemito(1, crearDocumentacion(1)), new DetalleRemito(2, crearDocumentacion(2))],
    origen,
    destino,
  );
  return new Bolsin(1, 1, origen, destino, [remito], cambios);
}

describe('CambioEstadoBolsin', () => {
  it('sosActual() es verdadero solo mientras no tiene fechaHoraFin', () => {
    const cambio = new CambioEstadoBolsin(1, ayer, null, enviadoBolsin, empleado);
    expect(cambio.sosActual()).toBe(true);
    cambio.setFechaHoraFin(hoy);
    expect(cambio.sosActual()).toBe(false);
  });

  it('sosEnviado() exige ser el cambio actual y que el estado sea Enviado', () => {
    expect(new CambioEstadoBolsin(1, ayer, null, enviadoBolsin, empleado).sosEnviado()).toBe(true);
    expect(new CambioEstadoBolsin(1, ayer, hoy, enviadoBolsin, empleado).sosEnviado()).toBe(false);
    expect(new CambioEstadoBolsin(1, ayer, null, recibidoBolsin, empleado).sosEnviado()).toBe(false);
  });
});

describe('Bolsin', () => {
  it('sin cambios de estado no tiene estado actual ni está enviado', () => {
    const bolsin = crearBolsin([]);
    expect(bolsin.getEstadoActual()).toBeUndefined();
    expect(bolsin.sosEnviado()).toBe(false);
  });

  it('con un cambio abierto en Enviado, ese es el actual y sosEnviado() es verdadero', () => {
    const cambio = new CambioEstadoBolsin(1, ayer, null, enviadoBolsin, empleado);
    const bolsin = crearBolsin([cambio]);
    expect(bolsin.getEstadoActual()).toBe(cambio);
    expect(bolsin.sosEnviado()).toBe(true);
  });

  it('con N cambios, el actual es el único sin fechaHoraFin', () => {
    const anterior = new CambioEstadoBolsin(1, ayer, hoy, enviadoBolsin, empleado);
    const actual = new CambioEstadoBolsin(2, hoy, null, recibidoBolsin, empleado);
    const bolsin = crearBolsin([anterior, actual]);
    expect(bolsin.getEstadoActual()).toBe(actual);
    expect(bolsin.sosEnviado()).toBe(false);
  });

  it('registrarCambioEstadoBolsin() cierra el cambio actual y abre uno nuevo con el responsable', () => {
    const enviado = new CambioEstadoBolsin(1, ayer, null, enviadoBolsin, empleado);
    const bolsin = crearBolsin([enviado]);

    bolsin.registrarCambioEstadoBolsin(recibidoBolsin, empleado, hoy);

    expect(enviado.fechaHoraFin).toEqual(hoy);
    const actual = bolsin.getEstadoActual();
    expect(actual?.id).toBeNull();
    expect(actual?.estado.sosRecibido()).toBe(true);
    expect(actual?.responsable).toBe(empleado);
    expect(bolsin.getCambiosEstado()).toHaveLength(2);
  });

  it('delega en cascada hasta la documentación', () => {
    const bolsin = crearBolsin([new CambioEstadoBolsin(1, ayer, null, enviadoBolsin, empleado)]);

    bolsin.actualizarEstadoRemito(recibidoYAceptado);
    bolsin.actualizarDocumentacion(aceptada, empleado, hoy);

    expect(bolsin.buscarRemitoBolsin()[0].getEstado().sosRecibidoYAceptado()).toBe(true);
    const documentaciones = bolsin.buscarDocumentacionBolsin();
    expect(documentaciones).toHaveLength(2);
    for (const documentacion of documentaciones) {
      expect(documentacion.getEstadoActual()?.estado.sosAceptada()).toBe(true);
    }
  });
});

describe('Documentacion', () => {
  it('recibir() pasa de EnBolsinEnviado a Aceptada cerrando el cambio anterior', () => {
    const documentacion = crearDocumentacion(1);
    const previo = documentacion.getEstadoActual();

    documentacion.recibir(aceptada, empleado, hoy);

    expect(previo?.fechaHoraFin).toEqual(hoy);
    expect(documentacion.getEstadoActual()?.estado.sosAceptada()).toBe(true);
    expect(documentacion.getEstadoActual()?.fechaHoraInicio).toEqual(hoy);
    expect(documentacion.getCambiosEstado().filter((c) => c.sosActual())).toHaveLength(1);
  });

  it('expone asunto y tipo como pide la pantalla', () => {
    const documentacion = crearDocumentacion(7);
    expect(documentacion.getAsunto()).toBe('Asunto 7');
    expect(documentacion.mostrarTipoDocumentacion()).toBe('Expediente médico');
  });
});
