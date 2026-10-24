import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Esquema inicial. `bolsin.numero_precinto` y `remito.numero` nacen como texto
 * (igual que en el modelo original); la migración siguiente los pasa a
 * `integer`.
 */
export class Inicial1781740800000 implements MigrationInterface {
  name = 'Inicial1781740800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "comision_medica" (
        "id" SERIAL NOT NULL,
        "nombre" character varying NOT NULL,
        CONSTRAINT "uq_comision_medica_nombre" UNIQUE ("nombre"),
        CONSTRAINT "pk_comision_medica" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(`
      CREATE TABLE "empleado" (
        "id" SERIAL NOT NULL,
        "apellido" character varying NOT NULL,
        "email" character varying NOT NULL,
        "comision_medica_id" integer NOT NULL,
        CONSTRAINT "uq_empleado_email" UNIQUE ("email"),
        CONSTRAINT "pk_empleado" PRIMARY KEY ("id"),
        CONSTRAINT "fk_empleado_comision_medica" FOREIGN KEY ("comision_medica_id")
          REFERENCES "comision_medica"("id")
      )`);
    await queryRunner.query(`
      CREATE TABLE "usuario" (
        "id" SERIAL NOT NULL,
        "empleado_id" integer NOT NULL,
        CONSTRAINT "uq_usuario_empleado" UNIQUE ("empleado_id"),
        CONSTRAINT "pk_usuario" PRIMARY KEY ("id"),
        CONSTRAINT "fk_usuario_empleado" FOREIGN KEY ("empleado_id")
          REFERENCES "empleado"("id")
      )`);
    await queryRunner.query(`
      CREATE TABLE "sesion" (
        "id" SERIAL NOT NULL,
        "usuario_id" integer NOT NULL,
        CONSTRAINT "pk_sesion" PRIMARY KEY ("id"),
        CONSTRAINT "fk_sesion_usuario" FOREIGN KEY ("usuario_id")
          REFERENCES "usuario"("id")
      )`);
    await queryRunner.query(`
      CREATE TABLE "estado" (
        "id" SERIAL NOT NULL,
        "nombre" character varying NOT NULL,
        "ambito" character varying NOT NULL,
        CONSTRAINT "uq_estado_nombre_ambito" UNIQUE ("nombre", "ambito"),
        CONSTRAINT "pk_estado" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(`
      CREATE TABLE "tipo_documentacion" (
        "id" SERIAL NOT NULL,
        "nombre" character varying NOT NULL,
        CONSTRAINT "uq_tipo_documentacion_nombre" UNIQUE ("nombre"),
        CONSTRAINT "pk_tipo_documentacion" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(`
      CREATE TABLE "bolsin" (
        "id" SERIAL NOT NULL,
        "numero_precinto" character varying NOT NULL,
        "cm_origen_id" integer NOT NULL,
        "cm_destino_id" integer NOT NULL,
        CONSTRAINT "uq_bolsin_numero_precinto" UNIQUE ("numero_precinto"),
        CONSTRAINT "pk_bolsin" PRIMARY KEY ("id"),
        CONSTRAINT "fk_bolsin_cm_origen" FOREIGN KEY ("cm_origen_id")
          REFERENCES "comision_medica"("id"),
        CONSTRAINT "fk_bolsin_cm_destino" FOREIGN KEY ("cm_destino_id")
          REFERENCES "comision_medica"("id")
      )`);
    await queryRunner.query(`
      CREATE TABLE "remito" (
        "id" SERIAL NOT NULL,
        "numero" character varying NOT NULL,
        "bolsin_id" integer NOT NULL,
        "estado_id" integer NOT NULL,
        "cm_origen_id" integer NOT NULL,
        "cm_destino_id" integer NOT NULL,
        CONSTRAINT "uq_remito_numero" UNIQUE ("numero"),
        CONSTRAINT "pk_remito" PRIMARY KEY ("id"),
        CONSTRAINT "fk_remito_bolsin" FOREIGN KEY ("bolsin_id") REFERENCES "bolsin"("id"),
        CONSTRAINT "fk_remito_estado" FOREIGN KEY ("estado_id") REFERENCES "estado"("id"),
        CONSTRAINT "fk_remito_cm_origen" FOREIGN KEY ("cm_origen_id")
          REFERENCES "comision_medica"("id"),
        CONSTRAINT "fk_remito_cm_destino" FOREIGN KEY ("cm_destino_id")
          REFERENCES "comision_medica"("id")
      )`);
    await queryRunner.query(`CREATE INDEX "ix_remito_estado" ON "remito" ("estado_id")`);
    await queryRunner.query(`
      CREATE TABLE "documentacion" (
        "id" SERIAL NOT NULL,
        "asunto" character varying NOT NULL,
        "tipo_documentacion_id" integer NOT NULL,
        "cm_origen_id" integer NOT NULL,
        CONSTRAINT "pk_documentacion" PRIMARY KEY ("id"),
        CONSTRAINT "fk_documentacion_tipo_documentacion" FOREIGN KEY ("tipo_documentacion_id")
          REFERENCES "tipo_documentacion"("id"),
        CONSTRAINT "fk_documentacion_cm_origen" FOREIGN KEY ("cm_origen_id")
          REFERENCES "comision_medica"("id")
      )`);
    await queryRunner.query(`
      CREATE TABLE "detalle_remito" (
        "id" SERIAL NOT NULL,
        "remito_id" integer NOT NULL,
        "documentacion_id" integer NOT NULL,
        CONSTRAINT "pk_detalle_remito" PRIMARY KEY ("id"),
        CONSTRAINT "fk_detalle_remito_remito" FOREIGN KEY ("remito_id")
          REFERENCES "remito"("id"),
        CONSTRAINT "fk_detalle_remito_documentacion" FOREIGN KEY ("documentacion_id")
          REFERENCES "documentacion"("id")
      )`);
    await queryRunner.query(`
      CREATE TABLE "cambio_estado_bolsin" (
        "id" SERIAL NOT NULL,
        "fecha_hora_inicio" TIMESTAMP WITH TIME ZONE NOT NULL,
        "fecha_hora_fin" TIMESTAMP WITH TIME ZONE,
        "bolsin_id" integer NOT NULL,
        "estado_id" integer NOT NULL,
        "responsable_id" integer NOT NULL,
        CONSTRAINT "pk_cambio_estado_bolsin" PRIMARY KEY ("id"),
        CONSTRAINT "fk_cambio_estado_bolsin_bolsin" FOREIGN KEY ("bolsin_id")
          REFERENCES "bolsin"("id"),
        CONSTRAINT "fk_cambio_estado_bolsin_estado" FOREIGN KEY ("estado_id")
          REFERENCES "estado"("id"),
        CONSTRAINT "fk_cambio_estado_bolsin_responsable" FOREIGN KEY ("responsable_id")
          REFERENCES "empleado"("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX "ix_cambio_estado_bolsin_estado" ON "cambio_estado_bolsin" ("estado_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_cambio_estado_bolsin_actual" ON "cambio_estado_bolsin" ("bolsin_id", "fecha_hora_fin")`,
    );
    await queryRunner.query(`
      CREATE TABLE "cambio_estado_documentacion" (
        "id" SERIAL NOT NULL,
        "fecha_hora_inicio" TIMESTAMP WITH TIME ZONE NOT NULL,
        "fecha_hora_fin" TIMESTAMP WITH TIME ZONE,
        "documentacion_id" integer NOT NULL,
        "estado_id" integer NOT NULL,
        "responsable_id" integer NOT NULL,
        CONSTRAINT "pk_cambio_estado_documentacion" PRIMARY KEY ("id"),
        CONSTRAINT "fk_cambio_estado_documentacion_documentacion" FOREIGN KEY ("documentacion_id")
          REFERENCES "documentacion"("id"),
        CONSTRAINT "fk_cambio_estado_documentacion_estado" FOREIGN KEY ("estado_id")
          REFERENCES "estado"("id"),
        CONSTRAINT "fk_cambio_estado_documentacion_responsable" FOREIGN KEY ("responsable_id")
          REFERENCES "empleado"("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX "ix_cambio_estado_documentacion_estado" ON "cambio_estado_documentacion" ("estado_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_cambio_estado_documentacion_actual" ON "cambio_estado_documentacion" ("documentacion_id", "fecha_hora_fin")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const tabla of [
      'cambio_estado_documentacion',
      'cambio_estado_bolsin',
      'detalle_remito',
      'documentacion',
      'remito',
      'bolsin',
      'tipo_documentacion',
      'estado',
      'sesion',
      'usuario',
      'empleado',
      'comision_medica',
    ]) {
      await queryRunner.query(`DROP TABLE "${tabla}"`);
    }
  }
}
