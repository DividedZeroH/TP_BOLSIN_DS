import { Estado } from './estado';

describe('Estado', () => {
  it('responde los predicados de nombre', () => {
    expect(new Estado(1, 'Enviado', 'BOLSIN').sosEnviado()).toBe(true);
    expect(new Estado(2, 'Recibido', 'BOLSIN').sosRecibido()).toBe(true);
    expect(new Estado(3, 'RecibidoYAceptado', 'REMITO').sosRecibidoYAceptado()).toBe(true);
    expect(new Estado(4, 'Aceptada', 'DOCUMENTACION').sosAceptada()).toBe(true);
    expect(new Estado(5, 'EnBolsinEnviado', 'DOCUMENTACION').sosEnviado()).toBe(false);
  });

  it('responde los predicados de ámbito', () => {
    const estado = new Estado(1, 'Enviado', 'REMITO');
    expect(estado.sosAmbitoRemito()).toBe(true);
    expect(estado.sosAmbitoBolsin()).toBe(false);
    expect(estado.sosAmbitoDocumentacion()).toBe(false);
  });
});
