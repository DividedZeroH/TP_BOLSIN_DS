import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Carga un escenario mínimo y repetible para recorrer el flujo normal desde
 * Angular. Los upsert evitan duplicar los datos cada vez que se ejecuta el seed.
 */
async function main(): Promise<void> {
  const cmDestino = await prisma.comisionMedica.upsert({
    where: { nombre: 'Comisión Médica Córdoba' },
    update: {},
    create: { nombre: 'Comisión Médica Córdoba' },
  });
  const cmOrigen = await prisma.comisionMedica.upsert({
    where: { nombre: 'Comisión Médica Villa María' },
    update: {},
    create: { nombre: 'Comisión Médica Villa María' },
  });

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

  const estados = await Promise.all([
    prisma.estado.upsert({
      where: { Nombre_Ambito: { Nombre: 'Enviado', Ambito: 'BOLSIN' } },
      update: { SosEnviado: true, SosAmbitoBolsin: true },
      create: { Nombre: 'Enviado', Ambito: 'BOLSIN', SosEnviado: true, SosAmbitoBolsin: true },
    }),
    prisma.estado.upsert({
      where: { Nombre_Ambito: { Nombre: 'Recibido en CM destino', Ambito: 'BOLSIN' } },
      update: {},
      create: { Nombre: 'Recibido en CM destino', Ambito: 'BOLSIN', SosAmbitoBolsin: true },
    }),
    prisma.estado.upsert({
      where: { Nombre_Ambito: { Nombre: 'Generado', Ambito: 'REMITO' } },
      update: {},
      create: { Nombre: 'Generado', Ambito: 'REMITO' },
    }),
    prisma.estado.upsert({
      where: { Nombre_Ambito: { Nombre: 'RecibidoYAceptado', Ambito: 'REMITO' } },
      update: {},
      create: { Nombre: 'RecibidoYAceptado', Ambito: 'REMITO' },
    }),
    prisma.estado.upsert({
      where: { Nombre_Ambito: { Nombre: 'EnBolsinEnviado', Ambito: 'DOCUMENTACION' } },
      update: {},
      create: { Nombre: 'EnBolsinEnviado', Ambito: 'DOCUMENTACION' },
    }),
    prisma.estado.upsert({
      where: { Nombre_Ambito: { Nombre: 'Aceptada', Ambito: 'DOCUMENTACION' } },
      update: {},
      create: { Nombre: 'Aceptada', Ambito: 'DOCUMENTACION' },
    }),
  ]);
  const [enviado, , generado, , enBolsinEnviado] = estados;

  const tipo = await prisma.tipoDocumentacion.upsert({
    where: { nombre: 'Expediente médico' },
    update: {},
    create: {
      nombre: 'Expediente médico',
      descripcion: 'Documentación médica remitida entre comisiones.',
    },
  });
  const documentacion = await prisma.documentacion.upsert({
    where: { numero: 'DOC-2026-001' },
    update: {},
    create: {
      numero: 'DOC-2026-001',
      asunto: 'Evaluación de incapacidad laboral',
      fechaPase: new Date('2026-06-18T12:00:00.000Z'),
      tipoDocumentacionId: tipo.id,
    },
  });

  // Si el seed se ejecuta después de una prueba, restablece el estado inicial
  // del agregado para que la demostración siempre comience en "Enviado".
  await prisma.cambioEstadoDocumentacion.deleteMany({ where: { documentacionId: documentacion.id } });
  await prisma.cambioEstadoDocumentacion.create({
    data: {
      documentacionId: documentacion.id,
      estadoId: enBolsinEnviado.id,
      empleadoId: empleado.id,
      fechaHoraInicio: new Date('2026-06-18T12:00:00.000Z'),
    },
  });

  const bolsin = await prisma.bolsin.upsert({
    where: { numeroBolsin: 'BOL-2026-001' },
    update: {
      comisionMedicaOrigenId: cmOrigen.id,
      comisionMedicaDestinoId: cmDestino.id,
    },
    create: {
      numeroBolsin: 'BOL-2026-001',
      numeroPrecinto: 'PREC-001',
      fecha: new Date('2026-06-18T12:00:00.000Z'),
      peso: 2.4,
      comisionMedicaOrigenId: cmOrigen.id,
      comisionMedicaDestinoId: cmDestino.id,
    },
  });
  await prisma.cambioEstadoBolsin.deleteMany({ where: { bolsinId: bolsin.id } });
  await prisma.cambioEstadoBolsin.create({
    data: {
      bolsinId: bolsin.id,
      estadoId: enviado.id,
      empleadoId: empleado.id,
      fechaHoraInicio: new Date('2026-06-18T12:00:00.000Z'),
    },
  });

  const remito = await prisma.remito.upsert({
    where: { Numero: 'REM-2026-001' },
    update: { bolsinId: bolsin.id, estadoId: generado.id },
    create: {
      Numero: 'REM-2026-001',
      fecha: new Date('2026-06-18T12:00:00.000Z'),
      bolsinId: bolsin.id,
      estadoId: generado.id,
    },
  });
  const detalle = await prisma.detalleRemito.findFirst({
    where: { remitoId: remito.id, documentacionId: documentacion.id },
  });
  if (!detalle) {
    await prisma.detalleRemito.create({
      data: {
        areaCMCDestino: 'Mesa de entradas',
        remitoId: remito.id,
        documentacionId: documentacion.id,
      },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
