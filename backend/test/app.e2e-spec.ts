import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { migrarBaseDeTest, reiniciarEscenario } from './base-de-datos';

const BASE = '/api/recepciones-bolsines';
const RECEPCION_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

describe('CU28 Registrar recepción de bolsín (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    await migrarBaseDeTest();
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configurarApp(modulo.createNestApplication()) as INestApplication<App>;
    await app.init();
    dataSource = app.get(DataSource);
  });

  beforeEach(() => reiniciarEscenario(dataSource));

  afterAll(() => app?.close());

  const api = () => request(app.getHttpServer());

  async function iniciar(): Promise<string> {
    const respuesta = await api().post(BASE).send({ sesionId: 1 }).expect(201);
    return respuesta.body.recepcionId as string;
  }

  it('GET /api/sesiones/1/comision-medica devuelve el usuario y su comisión', async () => {
    const { body } = await api().get('/api/sesiones/1/comision-medica').expect(200);
    expect(body).toEqual({
      usuarioLogueado: { id: 1, apellido: 'Pérez', email: 'encargado.cordoba@demo.local' },
      comisionMedica: { id: 1, nombre: 'Comisión Médica Córdoba' },
    });
  });

  it('recorre el flujo completo y deja todo recibido', async () => {
    const inicio = await api().post(BASE).send({ sesionId: 1 }).expect(201);
    expect(inicio.body.comisionMedica.nombre).toBe('Comisión Médica Córdoba');
    expect(inicio.body.bolsines).toHaveLength(5);
    const { recepcionId } = inicio.body as { recepcionId: string };

    const seleccion = await api()
      .post(`${BASE}/${recepcionId}/bolsin`)
      .send({ numeroPrecinto: 2 })
      .expect(200);
    expect(seleccion.body.bolsin.numeroPrecinto).toBe(2);
    expect(seleccion.body.documentacion).toHaveLength(4);
    expect(seleccion.body.opciones).toEqual([
      expect.objectContaining({ codigo: 'CONTENIDO_IGUAL', implementado: true }),
      expect.objectContaining({ codigo: 'FALTA_DOCUMENTACION', implementado: false }),
      expect.objectContaining({ codigo: 'DOCUMENTACION_NO_CORRESPONDE', implementado: false }),
      expect.objectContaining({ codigo: 'REDIRIGIR_OTRA_AREA', implementado: false }),
    ]);

    const rehidratada = await api().get(`${BASE}/${recepcionId}`).expect(200);
    expect(rehidratada.body).toMatchObject({ paso: 'BOLSIN_SELECCIONADO', numeroPrecinto: 2 });

    const pedido = await api()
      .post(`${BASE}/${recepcionId}/opcion`)
      .send({ codigo: 'CONTENIDO_IGUAL' })
      .expect(200);
    expect(pedido.body.confirma).toBe(true);

    const fin = await api().post(`${BASE}/${recepcionId}/confirmacion`).send({}).expect(200);
    expect(fin.body).toMatchObject({
      numeroPrecinto: 2,
      estadoBolsin: 'Recibido',
      estadoRemitos: 'RecibidoYAceptado',
      estadoDocumentacion: 'Aceptada',
    });

    const [estadoBolsin] = await dataSource.query(
      `SELECT e.nombre FROM cambio_estado_bolsin c
         JOIN bolsin b ON b.id = c.bolsin_id JOIN estado e ON e.id = c.estado_id
        WHERE b.numero_precinto = 2 AND c.fecha_hora_fin IS NULL`,
    );
    expect(estadoBolsin.nombre).toBe('Recibido');

    // La recepción se borra del store al terminar el CU.
    await api().get(`${BASE}/${recepcionId}`).expect(404);
  });

  it('paso fuera de orden: confirmar sin bolsín seleccionado es 400', async () => {
    const recepcionId = await iniciar();
    const { body } = await api().post(`${BASE}/${recepcionId}/confirmacion`).send({}).expect(400);
    expect(body.message).toBe('No hay bolsín seleccionado.');
    await api()
      .post(`${BASE}/${recepcionId}/opcion`)
      .send({ codigo: 'CONTENIDO_IGUAL' })
      .expect(400);
  });

  it('recepción inexistente o vencida es 404', async () => {
    await api().get(`${BASE}/${RECEPCION_INEXISTENTE}`).expect(404);
    await api()
      .post(`${BASE}/${RECEPCION_INEXISTENTE}/bolsin`)
      .send({ numeroPrecinto: 1 })
      .expect(404);
  });

  it('precinto que no pertenece a la comisión del usuario es 404', async () => {
    const recepcionId = await iniciar();
    await api().post(`${BASE}/${recepcionId}/bolsin`).send({ numeroPrecinto: 999 }).expect(404);
  });

  it('opción no implementada es 400', async () => {
    const recepcionId = await iniciar();
    await api().post(`${BASE}/${recepcionId}/bolsin`).send({ numeroPrecinto: 1 }).expect(200);
    await api()
      .post(`${BASE}/${recepcionId}/opcion`)
      .send({ codigo: 'REDIRIGIR_OTRA_AREA' })
      .expect(400);
    await api().post(`${BASE}/${recepcionId}/opcion`).send({ codigo: 'INVENTADA' }).expect(400);
  });

  it('cancelar borra la recepción en curso (204)', async () => {
    const recepcionId = await iniciar();
    await api().delete(`${BASE}/${recepcionId}`).expect(204);
    await api().get(`${BASE}/${recepcionId}`).expect(404);
  });

  it('valida el body con ValidationPipe', async () => {
    await api().post(BASE).send({ sesionId: 'uno' }).expect(400);
    await api().get(`${BASE}/no-es-un-uuid`).expect(400);
  });
});
