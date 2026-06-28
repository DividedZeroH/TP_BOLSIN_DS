PRAGMA foreign_keys=OFF;

CREATE TABLE "ComisionMedica" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "nombre" TEXT NOT NULL
);
CREATE UNIQUE INDEX "ComisionMedica_nombre_key" ON "ComisionMedica"("nombre");

CREATE TABLE "Empleado" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "apellido" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "comisionMedicaId" INTEGER NOT NULL,
  CONSTRAINT "Empleado_comisionMedicaId_fkey" FOREIGN KEY ("comisionMedicaId") REFERENCES "ComisionMedica"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Empleado_email_key" ON "Empleado"("email");

CREATE TABLE "Usuario" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "empleadoId" INTEGER NOT NULL,
  CONSTRAINT "Usuario_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Usuario_empleadoId_key" ON "Usuario"("empleadoId");

CREATE TABLE "Sesion" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "usuarioId" INTEGER NOT NULL,
  CONSTRAINT "Sesion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Estado" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "Nombre" TEXT NOT NULL,
  "Ambito" TEXT NOT NULL
);
CREATE UNIQUE INDEX "Estado_Nombre_Ambito_key" ON "Estado"("Nombre", "Ambito");

CREATE TABLE "Bolsin" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "numeroPrecinto" TEXT NOT NULL,
  "comisionMedicaOrigenId" INTEGER NOT NULL,
  "comisionMedicaDestinoId" INTEGER NOT NULL,
  CONSTRAINT "Bolsin_comisionMedicaOrigenId_fkey" FOREIGN KEY ("comisionMedicaOrigenId") REFERENCES "ComisionMedica"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Bolsin_comisionMedicaDestinoId_fkey" FOREIGN KEY ("comisionMedicaDestinoId") REFERENCES "ComisionMedica"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Bolsin_numeroPrecinto_key" ON "Bolsin"("numeroPrecinto");

CREATE TABLE "CambioEstadoBolsin" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "fechaHoraInicio" DATETIME NOT NULL,
  "fechaHoraFin" DATETIME,
  "bolsinId" INTEGER NOT NULL,
  "estadoId" INTEGER NOT NULL,
  "empleadoId" INTEGER NOT NULL,
  CONSTRAINT "CambioEstadoBolsin_bolsinId_fkey" FOREIGN KEY ("bolsinId") REFERENCES "Bolsin"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CambioEstadoBolsin_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "Estado"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CambioEstadoBolsin_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Remito" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "Numero" TEXT NOT NULL,
  "bolsinId" INTEGER NOT NULL,
  "estadoId" INTEGER NOT NULL,
  CONSTRAINT "Remito_bolsinId_fkey" FOREIGN KEY ("bolsinId") REFERENCES "Bolsin"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Remito_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "Estado"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Remito_Numero_key" ON "Remito"("Numero");

CREATE TABLE "TipoDocumentacion" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "nombre" TEXT NOT NULL
);
CREATE UNIQUE INDEX "TipoDocumentacion_nombre_key" ON "TipoDocumentacion"("nombre");

CREATE TABLE "Documentacion" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "asunto" TEXT NOT NULL,
  "tipoDocumentacionId" INTEGER NOT NULL,
  CONSTRAINT "Documentacion_tipoDocumentacionId_fkey" FOREIGN KEY ("tipoDocumentacionId") REFERENCES "TipoDocumentacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "DetalleRemito" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "remitoId" INTEGER NOT NULL,
  "documentacionId" INTEGER NOT NULL,
  CONSTRAINT "DetalleRemito_remitoId_fkey" FOREIGN KEY ("remitoId") REFERENCES "Remito"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DetalleRemito_documentacionId_fkey" FOREIGN KEY ("documentacionId") REFERENCES "Documentacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "CambioEstadoDocumentacion" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "fechaHoraInicio" DATETIME NOT NULL,
  "fechaHoraFin" DATETIME,
  "documentacionId" INTEGER NOT NULL,
  "estadoId" INTEGER NOT NULL,
  "empleadoId" INTEGER NOT NULL,
  CONSTRAINT "CambioEstadoDocumentacion_documentacionId_fkey" FOREIGN KEY ("documentacionId") REFERENCES "Documentacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CambioEstadoDocumentacion_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "Estado"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CambioEstadoDocumentacion_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
