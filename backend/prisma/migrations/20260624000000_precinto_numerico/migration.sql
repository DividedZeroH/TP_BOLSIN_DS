PRAGMA foreign_keys=OFF;

CREATE TABLE "Bolsin_nuevo" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "fecha" DATETIME NOT NULL,
  "numeroBolsin" TEXT NOT NULL,
  "numeroPrecinto" INTEGER NOT NULL,
  "peso" REAL NOT NULL,
  "comisionMedicaOrigenId" INTEGER NOT NULL,
  "comisionMedicaDestinoId" INTEGER NOT NULL,
  CONSTRAINT "Bolsin_comisionMedicaOrigenId_fkey" FOREIGN KEY ("comisionMedicaOrigenId") REFERENCES "ComisionMedica"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Bolsin_comisionMedicaDestinoId_fkey" FOREIGN KEY ("comisionMedicaDestinoId") REFERENCES "ComisionMedica"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "Bolsin_nuevo" (
  "id",
  "fecha",
  "numeroBolsin",
  "numeroPrecinto",
  "peso",
  "comisionMedicaOrigenId",
  "comisionMedicaDestinoId"
)
SELECT
  "id",
  "fecha",
  "numeroBolsin",
  CAST(REPLACE("numeroPrecinto", 'PREC-', '') AS INTEGER),
  "peso",
  "comisionMedicaOrigenId",
  "comisionMedicaDestinoId"
FROM "Bolsin";

DROP TABLE "Bolsin";
ALTER TABLE "Bolsin_nuevo" RENAME TO "Bolsin";

CREATE UNIQUE INDEX "Bolsin_numeroBolsin_key" ON "Bolsin"("numeroBolsin");
CREATE UNIQUE INDEX "Bolsin_numeroPrecinto_key" ON "Bolsin"("numeroPrecinto");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
