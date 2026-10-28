import { MigrationInterface, QueryRunner } from 'typeorm';

/** El catálogo de documentación adopta el nombre del diagrama de secuencia. */
export class EstadoDocumentacionSecuencia1793145600000 implements MigrationInterface {
  name = 'EstadoDocumentacionSecuencia1793145600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.renombrar(queryRunner, 'Aceptada', 'RecibidoYAceptado');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.renombrar(queryRunner, 'RecibidoYAceptado', 'Aceptada');
  }

  private async renombrar(
    queryRunner: QueryRunner,
    anterior: string,
    nuevo: string,
  ): Promise<void> {
    // Si se ejecutó el seed nuevo antes de migrar, se conserva el ID histórico
    // y se reúnen sus referencias antes de quitar el registro duplicado.
    await queryRunner.query(
      `UPDATE "cambio_estado_documentacion" c SET "estado_id" = a."id"
         FROM "estado" a, "estado" n
        WHERE a."nombre" = $1 AND n."nombre" = $2
          AND a."ambito" = 'DOCUMENTACION' AND n."ambito" = 'DOCUMENTACION'
          AND c."estado_id" = n."id"`,
      [anterior, nuevo],
    );
    await queryRunner.query(
      `DELETE FROM "estado" n USING "estado" a
        WHERE a."nombre" = $1 AND n."nombre" = $2
          AND a."ambito" = 'DOCUMENTACION' AND n."ambito" = 'DOCUMENTACION'`,
      [anterior, nuevo],
    );
    await queryRunner.query(
      `UPDATE "estado" SET "nombre" = $2 WHERE "nombre" = $1 AND "ambito" = 'DOCUMENTACION'`,
      [anterior, nuevo],
    );
  }
}
