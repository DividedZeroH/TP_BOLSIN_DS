import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DocumentoSeed {
  numero: string;
  asunto: string;
  tipo: 'expediente' | 'informe';
  area: string;
}

interface RemitoSeed {
  numero: number;
  documentos: DocumentoSeed[];
}

interface BolsinSeed {
  numero: string;
  precinto: number;
  fecha: Date;
  peso: number;
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
        update: { SosEnviado: true, SosAmbitoBolsin: true },
        create: {
          Nombre: 'Enviado',
          Ambito: 'BOLSIN',
          SosEnviado: true,
          SosAmbitoBolsin: true,
        },
      }),
      prisma.estado.upsert({
        where: { Nombre_Ambito: { Nombre: 'Recibido', Ambito: 'BOLSIN' } },
        update: { SosAmbitoBolsin: true },
        create: {
          Nombre: 'Recibido',
          Ambito: 'BOLSIN',
          SosAmbitoBolsin: true,
        },
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
      update: {
        descripcion: 'Documentación médica remitida entre comisiones.',
      },
      create: {
        nombre: 'Expediente médico',
        descripcion: 'Documentación médica remitida entre comisiones.',
      },
    }),
    informe: await prisma.tipoDocumentacion.upsert({
      where: { nombre: 'Informe complementario' },
      update: {
        descripcion: 'Informe adjunto para completar la evaluación médica.',
      },
      create: {
        nombre: 'Informe complementario',
        descripcion: 'Informe adjunto para completar la evaluación médica.',
      },
    }),
  };

  const escenario: BolsinSeed[] = [
    {
      numero: 'BOL-2026-001',
      precinto: 1,
      fecha: fechaBase,
      peso: 2.4,
      origen: comisionesOrigen[0].nombre,
      remitos: [
        {
          numero: 1,
          documentos: [
            {
              numero: 'DOC-2026-001',
              asunto: 'Evaluación de incapacidad laboral',
              tipo: 'expediente',
              area: 'Mesa de entradas',
            },
            {
              numero: 'DOC-2026-002',
              asunto: 'Informe de antecedentes clínicos',
              tipo: 'informe',
              area: 'Mesa de entradas',
            },
          ],
        },
        {
          numero: 2,
          documentos: [
            {
              numero: 'DOC-2026-003',
              asunto: 'Revisión de dictamen médico',
              tipo: 'expediente',
              area: 'Auditoría médica',
            },
            {
              numero: 'DOC-2026-004',
              asunto: 'Estudios complementarios recibidos',
              tipo: 'informe',
              area: 'Auditoría médica',
            },
          ],
        },
      ],
    },
    {
      numero: 'BOL-2026-002',
      precinto: 2,
      fecha: new Date('2026-06-18T13:00:00.000Z'),
      peso: 3.1,
      origen: comisionesOrigen[1].nombre,
      remitos: [
        {
          numero: 3,
          documentos: [
            {
              numero: 'DOC-2026-005',
              asunto: 'Solicitud de junta médica',
              tipo: 'expediente',
              area: 'Secretaría médica',
            },
            {
              numero: 'DOC-2026-006',
              asunto: 'Resumen de historia clínica',
              tipo: 'informe',
              area: 'Secretaría médica',
            },
          ],
        },
        {
          numero: 4,
          documentos: [
            {
              numero: 'DOC-2026-007',
              asunto: 'Evaluación de reingreso laboral',
              tipo: 'expediente',
              area: 'Mesa de entradas',
            },
            {
              numero: 'DOC-2026-008',
              asunto: 'Informe de seguimiento',
              tipo: 'informe',
              area: 'Mesa de entradas',
            },
          ],
        },
      ],
    },
    {
      numero: 'BOL-2026-003',
      precinto: 3,
      fecha: new Date('2026-06-18T14:00:00.000Z'),
      peso: 1.9,
      origen: comisionesOrigen[2].nombre,
      remitos: [
        {
          numero: 5,
          documentos: [
            {
              numero: 'DOC-2026-009',
              asunto: 'Control de documentación previsional',
              tipo: 'expediente',
              area: 'Archivo médico',
            },
            {
              numero: 'DOC-2026-010',
              asunto: 'Informe de estudios laborales',
              tipo: 'informe',
              area: 'Archivo médico',
            },
          ],
        },
        {
          numero: 6,
          documentos: [
            {
              numero: 'DOC-2026-011',
              asunto: 'Actualización de pericia médica',
              tipo: 'expediente',
              area: 'Auditoría médica',
            },
            {
              numero: 'DOC-2026-012',
              asunto: 'Anexo de diagnóstico',
              tipo: 'informe',
              area: 'Auditoría médica',
            },
          ],
        },
      ],
    },
    {
      numero: 'BOL-2026-004',
      precinto: 4,
      fecha: new Date('2026-06-18T15:00:00.000Z'),
      peso: 2.7,
      origen: comisionesOrigen[0].nombre,
      remitos: [
        {
          numero: 7,
          documentos: [
            {
              numero: 'DOC-2026-013',
              asunto: 'Alta de expediente derivado',
              tipo: 'expediente',
              area: 'Mesa de entradas',
            },
            {
              numero: 'DOC-2026-014',
              asunto: 'Informe de derivación',
              tipo: 'informe',
              area: 'Mesa de entradas',
            },
          ],
        },
      ],
    },
    {
      numero: 'BOL-2026-005',
      precinto: 5,
      fecha: new Date('2026-06-18T16:00:00.000Z'),
      peso: 3.5,
      origen: comisionesOrigen[1].nombre,
      remitos: [
        {
          numero: 8,
          documentos: [
            {
              numero: 'DOC-2026-015',
              asunto: 'Ratificación de incapacidad',
              tipo: 'expediente',
              area: 'Secretaría médica',
            },
            {
              numero: 'DOC-2026-016',
              asunto: 'Informe de control final',
              tipo: 'informe',
              area: 'Secretaría médica',
            },
          ],
        },
      ],
    },
  ];

  const origenPorNombre = new Map(
    comisionesOrigen.map((comision) => [comision.nombre, comision]),
  );

  for (const item of escenario) {
    const origen = origenPorNombre.get(item.origen);
    if (!origen) {
      throw new Error(`No se encontro la comision de origen ${item.origen}.`);
    }

    const bolsin = await prisma.bolsin.upsert({
      where: { numeroBolsin: item.numero },
      update: {
        numeroPrecinto: item.precinto,
        fecha: item.fecha,
        peso: item.peso,
        comisionMedicaOrigenId: origen.id,
        comisionMedicaDestinoId: cmDestino.id,
      },
      create: {
        numeroBolsin: item.numero,
        numeroPrecinto: item.precinto,
        fecha: item.fecha,
        peso: item.peso,
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
          fecha: item.fecha,
          bolsinId: bolsin.id,
          estadoId: generado.id,
        },
        create: {
          Numero: remitoItem.numero,
          fecha: item.fecha,
          bolsinId: bolsin.id,
          estadoId: generado.id,
        },
      });

      for (const documentoItem of remitoItem.documentos) {
        const tipo = tipos[documentoItem.tipo];
        const documentacion = await prisma.documentacion.upsert({
          where: { numero: documentoItem.numero },
          update: {
            asunto: documentoItem.asunto,
            fechaPase: item.fecha,
            tipoDocumentacionId: tipo.id,
          },
          create: {
            numero: documentoItem.numero,
            asunto: documentoItem.asunto,
            fechaPase: item.fecha,
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
        if (detalle) {
          await prisma.detalleRemito.update({
            where: { id: detalle.id },
            data: { areaCMCDestino: documentoItem.area },
          });
        } else {
          await prisma.detalleRemito.create({
            data: {
              areaCMCDestino: documentoItem.area,
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
