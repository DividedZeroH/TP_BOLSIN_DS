import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DocumentoSeed {
  asunto: string;
  tipo: 'expediente' | 'informe';
}

interface RemitoSeed {
  numero: number;
  documentos: DocumentoSeed[];
}

interface BolsinSeed {
  precinto: number;
  fecha: Date;
  origen: string;
  remitos: RemitoSeed[];
}

const fechaBase = new Date('2026-06-18T12:00:00.000Z');

/**
 * Carga un escenario mediano y repetible para recorrer el flujo normal desde
 * Angular. Los upsert evitan duplicar datos y los cambios de estado se
 * restablecen para que cada ejecucion vuelva a dejar los bolsines enviados.
 */
async function main(): Promise<void> {
  const cmDestino = await prisma.comisionMedica.upsert({
    where: { nombre: 'Comisión Médica Córdoba' },
    update: {},
    create: { nombre: 'Comisión Médica Córdoba' },
  });

  const nombresOrigen = [
    'Comisión Médica Villa María',
    'Comisión Médica Río Cuarto',
    'Comisión Médica San Francisco',
  ];
  const comisionesOrigen = await Promise.all(
    nombresOrigen.map((nombre) =>
      prisma.comisionMedica.upsert({
        where: { nombre },
        update: {},
        create: { nombre },
      }),
    ),
  );

  const empleado = await prisma.empleado.upsert({
    where: { email: 'encargado.cordoba@demo.local' },
    update: { comisionMedicaId: cmDestino.id },
    create: {
      apellido: 'Pérez',
      email: 'encargado.cordoba@demo.local',
      comisionMedicaId: cmDestino.id,
    },
  });
  const usuario = await prisma.usuario.upsert({
    where: { empleadoId: empleado.id },
    update: {},
    create: { empleadoId: empleado.id },
  });
  await prisma.sesion.upsert({
    where: { id: 1 },
    update: { usuarioId: usuario.id },
    create: { id: 1, usuarioId: usuario.id },
  });

  const [enviado, , generado, , enBolsinEnviado] =
    await Promise.all([
      prisma.estado.upsert({
        where: { Nombre_Ambito: { Nombre: 'Enviado', Ambito: 'BOLSIN' } },
        update: {},
        create: { Nombre: 'Enviado', Ambito: 'BOLSIN' },
      }),
      prisma.estado.upsert({
        where: { Nombre_Ambito: { Nombre: 'Recibido', Ambito: 'BOLSIN' } },
        update: {},
        create: { Nombre: 'Recibido', Ambito: 'BOLSIN' },
      }),
      prisma.estado.upsert({
        where: { Nombre_Ambito: { Nombre: 'Generado', Ambito: 'REMITO' } },
        update: {},
        create: { Nombre: 'Generado', Ambito: 'REMITO' },
      }),
      prisma.estado.upsert({
        where: {
          Nombre_Ambito: { Nombre: 'RecibidoYAceptado', Ambito: 'REMITO' },
        },
        update: {},
        create: { Nombre: 'RecibidoYAceptado', Ambito: 'REMITO' },
      }),
      prisma.estado.upsert({
        where: {
          Nombre_Ambito: {
            Nombre: 'EnBolsinEnviado',
            Ambito: 'DOCUMENTACION',
          },
        },
        update: {},
        create: { Nombre: 'EnBolsinEnviado', Ambito: 'DOCUMENTACION' },
      }),
      prisma.estado.upsert({
        where: { Nombre_Ambito: { Nombre: 'Aceptada', Ambito: 'DOCUMENTACION' } },
        update: {},
        create: { Nombre: 'Aceptada', Ambito: 'DOCUMENTACION' },
      }),
    ]);

  const tipos = {
    expediente: await prisma.tipoDocumentacion.upsert({
      where: { nombre: 'Expediente médico' },
      update: {},
      create: {
        nombre: 'Expediente médico',
      },
    }),
    informe: await prisma.tipoDocumentacion.upsert({
      where: { nombre: 'Informe complementario' },
      update: {},
      create: {
        nombre: 'Informe complementario',
      },
    }),
  };

  const escenario: BolsinSeed[] = [
    {
      precinto: 1,
      fecha: fechaBase,
      origen: comisionesOrigen[0].nombre,
      remitos: [
        {
          numero: 1,
          documentos: [
            {
              asunto: 'Evaluación de incapacidad laboral',
              tipo: 'expediente',
            },
            {
              asunto: 'Informe de antecedentes clínicos',
              tipo: 'informe',
            },
          ],
        },
        {
          numero: 2,
          documentos: [
            {
              asunto: 'Revisión de dictamen médico',
              tipo: 'expediente',
            },
            {
              asunto: 'Estudios complementarios recibidos',
              tipo: 'informe',
            },
          ],
        },
      ],
    },
    {
      precinto: 2,
      fecha: new Date('2026-06-18T13:00:00.000Z'),
      origen: comisionesOrigen[1].nombre,
      remitos: [
        {
          numero: 3,
          documentos: [
            {
              asunto: 'Solicitud de junta médica',
              tipo: 'expediente',
            },
            {
              asunto: 'Resumen de historia clínica',
              tipo: 'informe',
            },
          ],
        },
        {
          numero: 4,
          documentos: [
            {
              asunto: 'Evaluación de reingreso laboral',
              tipo: 'expediente',
            },
            {
              asunto: 'Informe de seguimiento',
              tipo: 'informe',
            },
          ],
        },
      ],
    },
    {
      precinto: 3,
      fecha: new Date('2026-06-18T14:00:00.000Z'),
      origen: comisionesOrigen[2].nombre,
      remitos: [
        {
          numero: 5,
          documentos: [
            {
              asunto: 'Control de documentación previsional',
              tipo: 'expediente',
            },
            {
              asunto: 'Informe de estudios laborales',
              tipo: 'informe',
            },
          ],
        },
        {
          numero: 6,
          documentos: [
            {
              asunto: 'Actualización de pericia médica',
              tipo: 'expediente',
            },
            {
              asunto: 'Anexo de diagnóstico',
              tipo: 'informe',
            },
          ],
        },
      ],
    },
    {
      precinto: 4,
      fecha: new Date('2026-06-18T15:00:00.000Z'),
      origen: comisionesOrigen[0].nombre,
      remitos: [
        {
          numero: 7,
          documentos: [
            {
              asunto: 'Alta de expediente derivado',
              tipo: 'expediente',
            },
            {
              asunto: 'Informe de derivación',
              tipo: 'informe',
            },
          ],
        },
      ],
    },
    {
      precinto: 5,
      fecha: new Date('2026-06-18T16:00:00.000Z'),
      origen: comisionesOrigen[1].nombre,
      remitos: [
        {
          numero: 8,
          documentos: [
            {
              asunto: 'Ratificación de incapacidad',
              tipo: 'expediente',
            },
            {
              asunto: 'Informe de control final',
              tipo: 'informe',
            },
          ],
        },
      ],
    },
  ];

  const origenPorNombre = new Map(
    comisionesOrigen.map((comision) => [comision.nombre, comision]),
  );

  await prisma.cambioEstadoDocumentacion.deleteMany();
  await prisma.detalleRemito.deleteMany();
  await prisma.remito.deleteMany();
  await prisma.documentacion.deleteMany();
  await prisma.cambioEstadoBolsin.deleteMany();
  await prisma.bolsin.deleteMany();

  for (const item of escenario) {
    const origen = origenPorNombre.get(item.origen);
    if (!origen) {
      throw new Error(`No se encontro la comision de origen ${item.origen}.`);
    }

    const bolsin = await prisma.bolsin.upsert({
      where: { numeroPrecinto: item.precinto },
      update: {
        comisionMedicaOrigenId: origen.id,
        comisionMedicaDestinoId: cmDestino.id,
      },
      create: {
        numeroPrecinto: item.precinto,
        comisionMedicaOrigenId: origen.id,
        comisionMedicaDestinoId: cmDestino.id,
      },
    });

    await prisma.cambioEstadoBolsin.deleteMany({
      where: { bolsinId: bolsin.id },
    });
    await prisma.cambioEstadoBolsin.create({
      data: {
        bolsinId: bolsin.id,
        estadoId: enviado.id,
        empleadoId: empleado.id,
        fechaHoraInicio: item.fecha,
      },
    });

    for (const remitoItem of item.remitos) {
      const remito = await prisma.remito.upsert({
        where: { Numero: remitoItem.numero },
        update: {
          bolsinId: bolsin.id,
          estadoId: generado.id,
        },
        create: {
          Numero: remitoItem.numero,
          bolsinId: bolsin.id,
          estadoId: generado.id,
        },
      });

      for (const documentoItem of remitoItem.documentos) {
        const tipo = tipos[documentoItem.tipo];
        const documentacion = await prisma.documentacion.create({
          data: {
            asunto: documentoItem.asunto,
            tipoDocumentacionId: tipo.id,
          },
        });

        await prisma.cambioEstadoDocumentacion.deleteMany({
          where: { documentacionId: documentacion.id },
        });
        await prisma.cambioEstadoDocumentacion.create({
          data: {
            documentacionId: documentacion.id,
            estadoId: enBolsinEnviado.id,
            empleadoId: empleado.id,
            fechaHoraInicio: item.fecha,
          },
        });

        const detalle = await prisma.detalleRemito.findFirst({
          where: {
            remitoId: remito.id,
            documentacionId: documentacion.id,
          },
        });
        if (!detalle) {
          await prisma.detalleRemito.create({
            data: {
              remitoId: remito.id,
              documentacionId: documentacion.id,
            },
          });
        }
      }
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
