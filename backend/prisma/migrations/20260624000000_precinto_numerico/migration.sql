PRAGMA foreign_keys=OFF;

CREATE TABLE "Bolsin_nuevo" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "numeroPrecinto" INTEGER NOT NULL,
  "comisionMedicaOrigenId" INTEGER NOT NULL,
  "comisionMedicaDestinoId" INTEGER NOT NULL,
  CONSTRAINT "Bolsin_comisionMedicaOrigenId_fkey" FOREIGN KEY ("comisionMedicaOrigenId") REFERENCES "ComisionMedica"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Bolsin_comisionMedicaDestinoId_fkey" FOREIGN KEY ("comisionMedicaDestinoId") REFERENCES "ComisionMedica"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "Bolsin_nuevo" (
  "id",
  "numeroPrecinto",
  "comisionMedicaOrigenId",
  "comisionMedicaDestinoId"
)
SELECT
  "id",
  CAST(REPLACE("numeroPrecinto", 'PREC-', '') AS INTEGER),
  "comisionMedicaOrigenId",
  "comisionMedicaDestinoId"
FROM "Bolsin";

DROP TABLE "Bolsin";
ALTER TABLE "Bolsin_nuevo" RENAME TO "Bolsin";

CREATE UNIQUE INDEX "Bolsin_numeroPrecinto_key" ON "Bolsin"("numeroPrecinto");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
