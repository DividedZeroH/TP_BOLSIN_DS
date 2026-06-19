import { Bolsin, CambioEstadoBolsin } from './bolsin';
import {
  CambioEstadoDocumentacion,
  DetalleRemito,
  Documentacion,
  Remito,
  TipoDocumentacion,
} from './documentacion';
import { Estado } from './estado';
import { ComisionMedica, Empleado } from './identidad';

describe('Transiciones del flujo normal', () => {
  it('actualiza bolsín, remito y documentación en el agregado', () => {
    const cm = new ComisionMedica(1, 'CMC');
    const empleado = new Empleado(1, 'Pérez', 'demo@local', cm);
    const enviado = new Estado(1, 'Enviado', 'BOLSIN', true, true);
    const recibido = new Estado(2, 'Recibido', 'BOLSIN', false, true);
    const generado = new Estado(3, 'Generado', 'REMITO', false, false);
    const recibidoAceptado = new Estado(
      4,
      'RecibidoYAceptado',
      'REMITO',
      false,
      false,
    );
    const enBolsin = new Estado(
      5,
      'EnBolsinEnviado',
      'DOCUMENTACION',
      false,
      false,
    );
    const aceptada = new Estado(6, 'Aceptada', 'DOCUMENTACION', false, false);
    const inicio = new Date('2026-06-18T12:00:00.000Z');
    const fin = new Date('2026-06-18T13:00:00.000Z');
    const cambioDoc = new CambioEstadoDocumentacion(
      1,
      inicio,
      null,
      enBolsin,
      empleado,
    );
    const documentacion = new Documentacion(
      1,
      'Asunto',
      inicio,
      'DOC-1',
      new TipoDocumentacion(1, 'Descripción', 'Expediente'),
      [cambioDoc],
    );
    const remito = new Remito(
      1,
      inicio,
      'REM-1',
      generado,
      [new DetalleRemito(1, 'Mesa', documentacion)],
    );
    const cambioBolsin = new CambioEstadoBolsin(
      1,
      inicio,
      null,
      enviado,
      empleado,
    );
    const bolsin = new Bolsin(
      1,
      inicio,
      'BOL-1',
      'PREC-1',
      2.4,
      cm,
      cm,
      [remito],
      [cambioBolsin],
    );

    bolsin.registrarCambioEstadoBolsin(recibido, empleado, fin);
    bolsin.actualizarEstadoRemito(recibidoAceptado);
    bolsin.actualizarDocumentacion(aceptada, empleado, fin);

    expect(cambioBolsin.fechaHoraFin).toEqual(fin);
    expect(bolsin.getEstadoActual()?.estado.Nombre).toBe('Recibido');
    expect(documentacion.getEstadoActual()?.estado.Nombre).toBe('Aceptada');
    expect(recibidoAceptado.sosRecibidoYAceptado()).toBe(true);
  });
});
