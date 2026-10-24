import { MigrationInterface, QueryRunner } from 'typeorm';

/** `bolsin.numero_precinto` y `remito.numero` pasan de texto a `integer`. */
export class PrecintoRemitoNumerico1782259200000 implements MigrationInterface {
  name = 'PrecintoRemitoNumerico1782259200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bolsin" ALTER COLUMN "numero_precinto" TYPE integer USING "numero_precinto"::integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "remito" ALTER COLUMN "numero" TYPE integer USING "numero"::integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "remito" ALTER COLUMN "numero" TYPE character varying USING "numero"::character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "bolsin" ALTER COLUMN "numero_precinto" TYPE character varying USING "numero_precinto"::character varying`,
    );
  }
}
