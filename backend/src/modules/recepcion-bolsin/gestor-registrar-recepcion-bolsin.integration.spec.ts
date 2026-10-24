import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, IsNull } from 'typeorm';
import { migrarBaseDeTest, reiniciarEscenario } from '../../../test/base-de-datos';
import { DatabaseModule } from '../../database/database.module';
import { EstadoOrmEntity } from '../catalogo/persistence/estado.orm-entity';
import { ComisionMedicaOrmEntity } from '../organizacion/persistence/comision-medica.orm-entity';
import { GestorRegistrarRecepcionBolsin } from './gestor-registrar-recepcion-bolsin.service';
import { BolsinOrmEntity } from './persistence/bolsin.orm-entity';
import { CambioEstadoBolsinOrmEntity } from './persistence/cambio-estado-bolsin.orm-entity';
import { CambioEstadoDocumentacionOrmEntity } from './persistence/cambio-estado-documentacion.orm-entity';
import { RemitoOrmEntity } from './persistence/remito.orm-entity';
import { RecepcionBolsinModule } from './recepcion-bolsin.module';

describe('GestorRegistrarRecepcionBolsin (integración con Postgres)', () => {
  let modulo: TestingModule;
  let gestor: GestorRegistrarRecepcionBolsin;
  let dataSource: DataSource;

  beforeAll(async () => {
    await migrarBaseDeTest();
    modulo = await Test.createTestingModule({
      imports: [DatabaseModule, RecepcionBolsinModule],
    }).compile();
    gestor = modulo.get(GestorRegistrarRecepcionBolsin);
    dataSource = modulo.get(DataSource);
  });

  beforeEach(() => reiniciarEscenario(dataSource));

  afterAll(() => modulo?.close());

  it('flujo feliz: deja el bolsín Recibido, remitos RecibidoYAceptado y documentación Aceptada', async () => {
    const inicio = await gestor.nuevaRecepcionBolsin(1);
    expect(inicio.comisionMedica.nombre).toBe('Comisión Médica Córdoba');
    expect(inicio.bolsines.map((b) => b.numeroPrecinto)).toEqual([1, 2, 3, 4, 5]);

    const seleccion = gestor.tomarBolsin(inicio.recepcionId, 1);
    expect(seleccion.documentacion).toHaveLength(4);
    expect(seleccion.documentacion[0]).toMatchObject({
      numeroRemito: 1,
      tipo: 'Expediente médico',
      asunto: 'Evaluación de incapacidad laboral',
    });
    expect(seleccion.opciones).toHaveLength(4);
    expect(seleccion.opciones.filter((o) => o.implementado).map((o) => o.codigo)).toEqual([
      'CONTENIDO_IGUAL',
    ]);

    expect(gestor.tomarOpcion(inicio.recepcionId, 'CONTENIDO_IGUAL').confirma).toBe(true);
    const resultado = await gestor.tomarConfirmacion(inicio.recepcionId);
    expect(resultado.numeroPrecinto).toBe(1);

    const bolsin = await dataSource
      .getRepository(BolsinOrmEntity)
      .findOneByOrFail({ numeroPrecinto: 1 });
    const cambiosBolsin = await dataSource.getRepository(CambioEstadoBolsinOrmEntity).find({
      where: { bolsinId: bolsin.id },
      relations: { estado: true },
      order: { id: 'ASC' },
    });
    expect(cambiosBolsin).toHaveLength(2);
    expect(cambiosBolsin[0].estado.nombre).toBe('Enviado');
    expect(cambiosBolsin[0].fechaHoraFin).toEqual(new Date(resultado.fechaHora));
    expect(cambiosBolsin[1]).toMatchObject({ fechaHoraFin: null, responsableId: 1 });
    expect(cambiosBolsin[1].estado.nombre).toBe('Recibido');

    const remitos = await dataSource.getRepository(RemitoOrmEntity).find({
      where: { bolsinId: bolsin.id },
      relations: { estado: true },
    });
    expect(remitos.map((r) => r.estado.nombre)).toEqual(['RecibidoYAceptado', 'RecibidoYAceptado']);

    // Las 4 documentaciones del bolsín 1 pasan a Aceptada; las otras 12 siguen igual.
    const actualesDocumentacion = await dataSource
      .getRepository(CambioEstadoDocumentacionOrmEntity)
      .find({ where: { fechaHoraFin: IsNull() }, relations: { estado: true } });
    expect(actualesDocumentacion).toHaveLength(16);
    expect(actualesDocumentacion.filter((c) => c.estado.nombre === 'Aceptada')).toHaveLength(4);
    const cerrados = await dataSource
      .getRepository(CambioEstadoDocumentacionOrmEntity)
      .countBy({ fechaHoraFin: new Date(resultado.fechaHora) });
    expect(cerrados).toBe(4);

    // La recepción terminó y el bolsín ya no se ofrece.
    expect(() => gestor.consultarRecepcion(inicio.recepcionId)).toThrow(NotFoundException);
    const otraRecepcion = await gestor.nuevaRecepcionBolsin(1);
    expect(otraRecepcion.bolsines.map((b) => b.numeroPrecinto)).toEqual([2, 3, 4, 5]);
  });

  it('precinto inexistente: 404', async () => {
    const { recepcionId } = await gestor.nuevaRecepcionBolsin(1);
    expect(() => gestor.tomarBolsin(recepcionId, 999)).toThrow(NotFoundException);
  });

  it('bolsín enviado a otra comisión: no se ofrece y no se puede tomar', async () => {
    const comisiones = dataSource.getRepository(ComisionMedicaOrmEntity);
    const otraComision = await comisiones.findOneByOrFail({ nombre: 'Comisión Médica Río Cuarto' });
    const cordoba = await comisiones.findOneByOrFail({ nombre: 'Comisión Médica Córdoba' });
    const enviado = await dataSource
      .getRepository(EstadoOrmEntity)
      .findOneByOrFail({ nombre: 'Enviado', ambito: 'BOLSIN' });
    const { identifiers } = await dataSource.getRepository(BolsinOrmEntity).insert({
      numeroPrecinto: 6,
      cmOrigenId: cordoba.id,
      cmDestinoId: otraComision.id,
    });
    await dataSource.getRepository(CambioEstadoBolsinOrmEntity).insert({
      bolsinId: identifiers[0].id as number,
      estadoId: enviado.id,
      responsableId: 1,
      fechaHoraInicio: new Date(),
      fechaHoraFin: null,
    });

    const inicio = await gestor.nuevaRecepcionBolsin(1);
    expect(inicio.bolsines.map((b) => b.numeroPrecinto)).not.toContain(6);
    expect(() => gestor.tomarBolsin(inicio.recepcionId, 6)).toThrow(NotFoundException);
  });

  it('opción no implementada: 400', async () => {
    const { recepcionId } = await gestor.nuevaRecepcionBolsin(1);
    gestor.tomarBolsin(recepcionId, 2);
    expect(() => gestor.tomarOpcion(recepcionId, 'FALTA_DOCUMENTACION')).toThrow(
      BadRequestException,
    );
  });

  it('confirmación sin bolsín seleccionado: 400 y no escribe nada', async () => {
    const { recepcionId } = await gestor.nuevaRecepcionBolsin(1);
    await expect(gestor.tomarConfirmacion(recepcionId)).rejects.toThrow(
      'No hay bolsín seleccionado.',
    );
    expect(await dataSource.getRepository(CambioEstadoBolsinOrmEntity).count()).toBe(5);
  });

  it('confirmación sin opción tomada: 400', async () => {
    const { recepcionId } = await gestor.nuevaRecepcionBolsin(1);
    gestor.tomarBolsin(recepcionId, 3);
    await expect(gestor.tomarConfirmacion(recepcionId)).rejects.toThrow(BadRequestException);
  });

  it('recepción inexistente: 404', () => {
    expect(() => gestor.consultarRecepcion('00000000-0000-4000-8000-000000000000')).toThrow(
      NotFoundException,
    );
  });
});
