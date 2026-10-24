import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { EstadoOrmEntity } from '../../catalogo/persistence/estado.orm-entity';
import { EmpleadoOrmEntity } from '../../identidad/persistence/empleado.orm-entity';
import { DocumentacionOrmEntity } from './documentacion.orm-entity';

@Entity('cambio_estado_documentacion')
@Index('ix_cambio_estado_documentacion_actual', ['documentacionId', 'fechaHoraFin'])
export class CambioEstadoDocumentacionOrmEntity {
  @PrimaryGeneratedColumn({
    name: 'id',
    primaryKeyConstraintName: 'pk_cambio_estado_documentacion',
  })
  id!: number;

  @Column({ name: 'fecha_hora_inicio', type: 'timestamptz' })
  fechaHoraInicio!: Date;

  /** `null` = cambio actual (`sosActual()`). */
  @Column({ name: 'fecha_hora_fin', type: 'timestamptz', nullable: true })
  fechaHoraFin!: Date | null;

  @Column({ name: 'documentacion_id', type: 'integer' })
  documentacionId!: number;

  @ManyToOne(() => DocumentacionOrmEntity, (documentacion) => documentacion.cambiosEstado)
  @JoinColumn({
    name: 'documentacion_id',
    foreignKeyConstraintName: 'fk_cambio_estado_documentacion_documentacion',
  })
  documentacion!: Relation<DocumentacionOrmEntity>;

  @Index('ix_cambio_estado_documentacion_estado')
  @Column({ name: 'estado_id', type: 'integer' })
  estadoId!: number;

  @ManyToOne(() => EstadoOrmEntity)
  @JoinColumn({
    name: 'estado_id',
    foreignKeyConstraintName: 'fk_cambio_estado_documentacion_estado',
  })
  estado!: Relation<EstadoOrmEntity>;

  @Column({ name: 'responsable_id', type: 'integer' })
  responsableId!: number;

  @ManyToOne(() => EmpleadoOrmEntity)
  @JoinColumn({
    name: 'responsable_id',
    foreignKeyConstraintName: 'fk_cambio_estado_documentacion_responsable',
  })
  responsable!: Relation<EmpleadoOrmEntity>;
}
