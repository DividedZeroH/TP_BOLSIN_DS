import { Bolsin } from './bolsin';
import { CambioEstadoBolsin } from './cambioEstadoBolsin';
import { CambioEstadoDocumentacion } from './cambioEstadoDocumentacion';
import { ComisionMedica } from './comisionMedica';
import { DetalleRemito } from './detalleRemito';
import { Documentacion } from './documentacion';
import { Empleado } from './empleado';
import { Estado } from './estado';
import { Remito } from './remito';
import { TipoDocumentacion } from './tipoDocumentacion';

describe('Transiciones del flujo normal', () => {
  it('actualiza bolsin, remito y documentacion en el agregado', () => {
    const cm = new ComisionMedica(1, 'CMC');
    const empleado = new Empleado(1, cm);
    const enviado = new Estado(1, 'Enviado', 'BOLSIN');
    const recibido = new Estado(2, 'Recibido', 'BOLSIN');
    const generado = new Estado(3, 'Generado', 'REMITO');
    const recibidoAceptado = new Estado(4, 'RecibidoYAceptado', 'REMITO');
    const enBolsin = new Estado(5, 'EnBolsinEnviado', 'DOCUMENTACION');
    const aceptada = new Estado(6, 'Aceptada', 'DOCUMENTACION');
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
      new TipoDocumentacion(1, 'Expediente medico'),
      [cambioDoc],
      cm,
    );
    const remito = new Remito(
      1,
      1,
      generado,
      [new DetalleRemito(1, documentacion)],
      cm,
      cm,
    );
    const cambioBolsin = new CambioEstadoBolsin(
      1,
      inicio,
      null,
      enviado,
      empleado,
    );
    const bolsin = new Bolsin(1, 1, cm, cm, [remito], [cambioBolsin]);

    bolsin.registrarCambioEstadoBolsin(recibido, empleado, fin);
    bolsin.actualizarEstadoRemito(recibidoAceptado);
    bolsin.actualizarDocumentacion(aceptada, empleado, fin);

    expect(cambioBolsin.fechaHoraFin).toEqual(fin);
    expect(bolsin.getEstadoActual()?.estado.Nombre).toBe('Recibido');
    expect(bolsin.getNumeroPrecinto()).toBe(1);
    expect(remito.getNumero()).toBe(1);
    expect(documentacion.getEstadoActual()?.estado.Nombre).toBe('Aceptada');
    expect(recibidoAceptado.sosRecibidoYAceptado()).toBe(true);
  });
});
