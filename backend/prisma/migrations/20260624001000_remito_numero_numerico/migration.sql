PRAGMA foreign_keys=OFF;

CREATE TABLE "Remito_nuevo" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "Numero" INTEGER NOT NULL,
  "bolsinId" INTEGER NOT NULL,
  "estadoId" INTEGER NOT NULL,
  CONSTRAINT "Remito_bolsinId_fkey" FOREIGN KEY ("bolsinId") REFERENCES "Bolsin"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Remito_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "Estado"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "Remito_nuevo" (
  "id",
  "Numero",
  "bolsinId",
  "estadoId"
)
SELECT
  "id",
  CAST(REPLACE("Numero", 'REM-2026-', '') AS INTEGER),
  "bolsinId",
  "estadoId"
FROM "Remito";

DROP TABLE "Remito";
ALTER TABLE "Remito_nuevo" RENAME TO "Remito";

CREATE UNIQUE INDEX "Remito_Numero_key" ON "Remito"("Numero");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
