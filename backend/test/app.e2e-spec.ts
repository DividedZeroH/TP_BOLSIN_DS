import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GestorRegistrarRecepcionBolsin } from '../src/recepcion-bolsin/gestor-registrar-recepcion-bolsin.service';

describe('Registrar recepción de bolsín (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let gestor: GestorRegistrarRecepcionBolsin;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    prisma = app.get(PrismaService);
    gestor = app.get(GestorRegistrarRecepcionBolsin);
  });

  afterAll(async () => app.close());

  it('recorre el flujo normal y conserva atomicidad ante errores', async () => {
    const inicio = await request(app.getHttpServer())
      .get('/api/recepciones-bolsines/iniciar?sesionId=1')
      .expect(200);
    expect(inicio.body.comisionMedica.nombre).toBe('Comisión Médica Córdoba');
    expect(inicio.body.bolsines).toHaveLength(5);
    const bolsinId = inicio.body.bolsines[0].id as number;

    const detalle = await request(app.getHttpServer())
      .get(`/api/recepciones-bolsines/${bolsinId}?sesionId=1`)
      .expect(200);
    expect(detalle.body.opciones).toEqual([
      {
        codigo: 'CONTENIDO_IGUAL',
        descripcion: 'El contenido del bolsín es igual al registrado.',
      },
    ]);
    expect(detalle.body.remitos).toHaveLength(2);
    expect(
      detalle.body.remitos.flatMap((remito: { documentaciones: unknown[] }) =>
        remito.documentaciones,
      ),
    ).toHaveLength(4);

    await request(app.getHttpServer())
      .post(`/api/recepciones-bolsines/${bolsinId}/confirmar`)
      .send({ sesionId: 1, opcion: 'FALTA_DOCUMENTACION', confirmacion: true })
      .expect(400);
    const historialTrasOpcionInvalida = await prisma.cambioEstadoBolsin.findMany({
      where: { bolsinId },
      include: { estado: true },
    });
    expect(historialTrasOpcionInvalida).toHaveLength(1);
    expect(historialTrasOpcionInvalida[0].estado.Nombre).toBe('Enviado');
    expect(historialTrasOpcionInvalida[0].fechaHoraFin).toBeNull();

    // Se fuerza un fallo luego de la primera escritura. Prisma debe revertir
    // el cambio de bolsín y CU29 no debe ejecutarse.
    const fallo = jest
      .spyOn(gestor, 'actualizarEstadoRemito')
      .mockRejectedValueOnce(new Error('Fallo simulado'));
    const notificacion = jest.spyOn(gestor, 'llamarCU29');
    await request(app.getHttpServer())
      .post(`/api/recepciones-bolsines/${bolsinId}/confirmar`)
      .send({ sesionId: 1, opcion: 'CONTENIDO_IGUAL', confirmacion: true })
      .expect(500);
    expect(notificacion).not.toHaveBeenCalled();
    const historialTrasFallo = await prisma.cambioEstadoBolsin.findMany({
      where: { bolsinId },
      include: { estado: true },
    });
    expect(historialTrasFallo).toHaveLength(1);
    expect(historialTrasFallo[0].estado.Nombre).toBe('Enviado');
    expect(historialTrasFallo[0].fechaHoraFin).toBeNull();
    fallo.mockRestore();

    const confirmacion = await request(app.getHttpServer())
      .post(`/api/recepciones-bolsines/${bolsinId}/confirmar`)
      .send({ sesionId: 1, opcion: 'CONTENIDO_IGUAL', confirmacion: true })
      .expect(201);
    expect(confirmacion.body).toMatchObject({
      estadoBolsin: 'Recibido',
      estadoRemitos: 'RecibidoYAceptado',
      estadoDocumentaciones: 'Aceptada',
    });
    expect(notificacion).toHaveBeenCalledWith(bolsinId);

    const bolsin = await prisma.bolsin.findUniqueOrThrow({
      where: { id: bolsinId },
      include: {
        cambiosEstado: { include: { estado: true, empleado: true } },
        remitos: {
          include: {
            estado: true,
            detalles: {
              include: {
                documentacion: {
                  include: {
                    cambiosEstado: { include: { estado: true, empleado: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    expect(bolsin.cambiosEstado).toHaveLength(2);
    expect(
      bolsin.cambiosEstado.find((c) => c.fechaHoraFin === null)?.estado.Nombre,
    ).toBe('Recibido');
    expect(bolsin.remitos.every((remito) => remito.estado.Nombre === 'RecibidoYAceptado'))
      .toBe(true);
    const cambiosDoc = bolsin.remitos.flatMap((remito) =>
      remito.detalles.flatMap((detalle) =>
        detalle.documentacion.cambiosEstado,
      ),
    );
    expect(cambiosDoc).toHaveLength(8);
    const cambiosAceptada = cambiosDoc.filter((c) => c.fechaHoraFin === null);
    expect(cambiosAceptada).toHaveLength(4);
    expect(cambiosAceptada.every((c) => c.estado.Nombre === 'Aceptada')).toBe(true);
    expect(cambiosAceptada.every((c) => c.empleado.email === 'encargado.cordoba@demo.local'))
      .toBe(true);
  });
});
