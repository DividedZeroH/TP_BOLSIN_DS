import { DataSource, EntityManager } from 'typeorm';
import { Estado, AmbitoEstado } from '../../modules/estados/entity/estado.entity';
import { Empleado } from '../../modules/empleados/entity/empleado.entity';
import { Usuario } from '../../modules/usuarios/entity/usuario.entity';
import { ComisionMedica } from '../../modules/comisiones-medicas/entity/comision-medica.entity';
import { Bolsin } from '../../modules/bolsines/entity/bolsin.entity';
import { CambioEstadoBolsin } from '../../modules/bolsines/entity/cambio-estado-bolsin.entity';
import { CambioEstadoDocumentacion } from '../../modules/documentaciones/entity/cambio-estado-documentacion.entity';
import { DetalleRemito } from '../../modules/remitos/entity/detalle-remito.entity';
import { Documentacion } from '../../modules/documentaciones/entity/documentacion.entity';
import { Remito } from '../../modules/remitos/entity/remito.entity';
import { TipoDocumentacion } from '../../modules/documentaciones/entity/tipo-documentacion.entity';

type TipoSeed = 'expediente' | 'informe';

interface BolsinSeed {
  precinto: number;
  fecha: string;
  origen: number;
  remitos: { numero: number; documentos: [string, TipoSeed][] }[];
}

const CM_DESTINO = 'Comisión Médica Córdoba';
const CM_ORIGEN = [
  'Comisión Médica Villa María',
  'Comisión Médica Río Cuarto',
  'Comisión Médica San Francisco',
];

/** Los únicos estados que usa el CU28 (los nombres siguen al README). */
const ESTADOS: Pick<Estado, 'nombre' | 'ambito'>[] = [
  { nombre: 'Enviado', ambito: 'BOLSIN' },
  { nombre: 'Recibido', ambito: 'BOLSIN' },
  { nombre: 'Enviado', ambito: 'REMITO' },
  { nombre: 'RecibidoYAceptado', ambito: 'REMITO' },
  { nombre: 'EnBolsinEnviado', ambito: 'DOCUMENTACION' },
  { nombre: 'RecibidoYAceptado', ambito: 'DOCUMENTACION' },
];

/** Catálogo persistido e idempotente: la lógica de producción lo consulta en la BD. */
export async function sembrarEstados(manager: EntityManager): Promise<void> {
  // TypeORM añade los IDs generados a los objetos recibidos. No debe modificar
  // el catálogo reutilizado por ejecuciones posteriores del seed.
  const estados = ESTADOS.map(({ nombre, ambito }) => ({ nombre, ambito }));
  await manager.upsert(Estado, estados, ['nombre', 'ambito']);
}

const TIPOS: Record<TipoSeed, string> = {
  expediente: 'Expediente médico',
  informe: 'Informe complementario',
};

/** Precintos 1..5; la pantalla los muestra como BOL-2026-001 … BOL-2026-005. */
const ESCENARIO: BolsinSeed[] = [
  {
    precinto: 1,
    fecha: '2026-06-18T12:00:00.000Z',
    origen: 0,
    remitos: [
      {
        numero: 1,
        documentos: [
          ['Evaluación de incapacidad laboral', 'expediente'],
          ['Informe de antecedentes clínicos', 'informe'],
        ],
      },
      {
        numero: 2,
        documentos: [
          ['Revisión de dictamen médico', 'expediente'],
          ['Estudios complementarios recibidos', 'informe'],
        ],
      },
    ],
  },
  {
    precinto: 2,
    fecha: '2026-06-18T13:00:00.000Z',
    origen: 1,
    remitos: [
      {
        numero: 3,
        documentos: [
          ['Solicitud de junta médica', 'expediente'],
          ['Resumen de historia clínica', 'informe'],
        ],
      },
      {
        numero: 4,
        documentos: [
          ['Evaluación de reingreso laboral', 'expediente'],
          ['Informe de seguimiento', 'informe'],
        ],
      },
    ],
  },
  {
    precinto: 3,
    fecha: '2026-06-18T14:00:00.000Z',
    origen: 2,
    remitos: [
      {
        numero: 5,
        documentos: [
          ['Control de documentación previsional', 'expediente'],
          ['Informe de estudios laborales', 'informe'],
        ],
      },
      {
        numero: 6,
        documentos: [
          ['Actualización de pericia médica', 'expediente'],
          ['Anexo de diagnóstico', 'informe'],
        ],
      },
    ],
  },
  {
    precinto: 4,
    fecha: '2026-06-18T15:00:00.000Z',
    origen: 0,
    remitos: [
      {
        numero: 7,
        documentos: [
          ['Alta de expediente derivado', 'expediente'],
          ['Informe de derivación', 'informe'],
        ],
      },
    ],
  },
  {
    precinto: 5,
    fecha: '2026-06-18T16:00:00.000Z',
    origen: 1,
    remitos: [
      {
        numero: 8,
        documentos: [
          ['Ratificación de incapacidad', 'expediente'],
          ['Informe de control final', 'informe'],
        ],
      },
    ],
  },
];

async function upsertComision(
  manager: EntityManager,
  nombre: string,
): Promise<ComisionMedica> {
  await manager.upsert(ComisionMedica, { nombre }, ['nombre']);
  return manager.findOneByOrFail(ComisionMedica, { nombre });
}

/**
 * Carga el escenario de demo. Es idempotente: catálogos, identidad, bolsines
 * y remitos se hacen con `upsert` sobre claves únicas; la documentación y los
 * cambios de estado (que no tienen clave natural) se borran y se recrean, así
 * que cada corrida deja los 5 bolsines otra vez listos para recibir.
 */
export async function sembrar(manager: EntityManager): Promise<void> {
  const cmDestino = await upsertComision(manager, CM_DESTINO);
  const cmOrigen: ComisionMedica[] = [];
  for (const nombre of CM_ORIGEN) {
    cmOrigen.push(await upsertComision(manager, nombre));
  }

  await manager.upsert(
    Empleado,
    {
      apellido: 'Pérez',
      email: 'encargado.cordoba@demo.local',
      comisionMedicaId: cmDestino.id,
    },
    ['email'],
  );
  const empleado = await manager.findOneByOrFail(Empleado, {
    email: 'encargado.cordoba@demo.local',
  });
  await manager.upsert(Usuario, { empleadoId: empleado.id }, ['empleadoId']);
  const usuario = await manager.findOneByOrFail(Usuario, { empleadoId: empleado.id });
  // El frontend trabaja siempre con la sesión 1 (no hay autenticación). Va en
  // SQL porque `upsert` de TypeORM descarta el id de una PK autogenerada.
  await manager.query(
    `INSERT INTO "sesion" ("id", "usuario_id") VALUES (1, $1)
     ON CONFLICT ("id") DO UPDATE SET "usuario_id" = EXCLUDED."usuario_id"`,
    [usuario.id],
  );
  await manager.query(
    `SELECT setval(pg_get_serial_sequence('sesion', 'id'), (SELECT MAX("id") FROM "sesion"))`,
  );

  await sembrarEstados(manager);
  const estado = (nombre: string, ambito: AmbitoEstado) =>
    manager.findOneByOrFail(Estado, { nombre, ambito });
  const bolsinEnviado = await estado('Enviado', 'BOLSIN');
  const remitoEnviado = await estado('Enviado', 'REMITO');
  const documentacionEnviada = await estado('EnBolsinEnviado', 'DOCUMENTACION');

  await manager.upsert(
    TipoDocumentacion,
    Object.values(TIPOS).map((nombre) => ({ nombre })),
    ['nombre'],
  );
  const tipos = {} as Record<TipoSeed, TipoDocumentacion>;
  for (const [clave, nombre] of Object.entries(TIPOS) as [TipoSeed, string][]) {
    tipos[clave] = await manager.findOneByOrFail(TipoDocumentacion, { nombre });
  }

  // Lo que no tiene clave natural se recrea desde cero.
  await manager.query(
    `TRUNCATE "cambio_estado_documentacion", "detalle_remito", "documentacion", "cambio_estado_bolsin" RESTART IDENTITY`,
  );

  for (const item of ESCENARIO) {
    const origen = cmOrigen[item.origen];
    const fecha = new Date(item.fecha);

    await manager.upsert(
      Bolsin,
      { numeroPrecinto: item.precinto, cmOrigenId: origen.id, cmDestinoId: cmDestino.id },
      ['numeroPrecinto'],
    );
    const bolsin = await manager.findOneByOrFail(Bolsin, {
      numeroPrecinto: item.precinto,
    });
    await manager.insert(CambioEstadoBolsin, {
      bolsinId: bolsin.id,
      estadoId: bolsinEnviado.id,
      responsableId: empleado.id,
      fechaHoraInicio: fecha,
      fechaHoraFin: null,
    });

    for (const remitoItem of item.remitos) {
      await manager.upsert(
        Remito,
        {
          numero: remitoItem.numero,
          bolsinId: bolsin.id,
          estadoId: remitoEnviado.id,
          cmOrigenId: origen.id,
          cmDestinoId: cmDestino.id,
        },
        ['numero'],
      );
      const remito = await manager.findOneByOrFail(Remito, {
        numero: remitoItem.numero,
      });

      for (const [asunto, tipo] of remitoItem.documentos) {
        const { identifiers } = await manager.insert(Documentacion, {
          asunto,
          tipoDocumentacionId: tipos[tipo].id,
          cmOrigenId: origen.id,
        });
        const documentacionId = identifiers[0].id as number;
        await manager.insert(CambioEstadoDocumentacion, {
          documentacionId,
          estadoId: documentacionEnviada.id,
          responsableId: empleado.id,
          fechaHoraInicio: fecha,
          fechaHoraFin: null,
        });
        await manager.insert(DetalleRemito, { remitoId: remito.id, documentacionId });
      }
    }
  }
}

if (require.main === module) {
  // La conexión se abre únicamente al ejecutar el comando de seed.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dataSource: DataSource = require('../data-source').default;
  dataSource
    .initialize()
    .then((ds) => ds.transaction((manager) => sembrar(manager)))
    .then(() => console.log('Seed aplicado.'))
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => dataSource.isInitialized && dataSource.destroy());
}
