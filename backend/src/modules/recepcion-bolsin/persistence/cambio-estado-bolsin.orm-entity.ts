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
import { BolsinOrmEntity } from './bolsin.orm-entity';

@Entity('cambio_estado_bolsin')
@Index('ix_cambio_estado_bolsin_actual', ['bolsinId', 'fechaHoraFin'])
export class CambioEstadoBolsinOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_cambio_estado_bolsin' })
  id!: number;

  @Column({ name: 'fecha_hora_inicio', type: 'timestamptz' })
  fechaHoraInicio!: Date;

  /** `null` = cambio actual (`sosActual()`). */
  @Column({ name: 'fecha_hora_fin', type: 'timestamptz', nullable: true })
  fechaHoraFin!: Date | null;

  @Column({ name: 'bolsin_id', type: 'integer' })
  bolsinId!: number;

  @ManyToOne(() => BolsinOrmEntity, (bolsin) => bolsin.cambiosEstado)
  @JoinColumn({ name: 'bolsin_id', foreignKeyConstraintName: 'fk_cambio_estado_bolsin_bolsin' })
  bolsin!: Relation<BolsinOrmEntity>;

  @Index('ix_cambio_estado_bolsin_estado')
  @Column({ name: 'estado_id', type: 'integer' })
  estadoId!: number;

  @ManyToOne(() => EstadoOrmEntity)
  @JoinColumn({ name: 'estado_id', foreignKeyConstraintName: 'fk_cambio_estado_bolsin_estado' })
  estado!: Relation<EstadoOrmEntity>;

  @Column({ name: 'responsable_id', type: 'integer' })
  responsableId!: number;

  @ManyToOne(() => EmpleadoOrmEntity)
  @JoinColumn({
    name: 'responsable_id',
    foreignKeyConstraintName: 'fk_cambio_estado_bolsin_responsable',
  })
  responsable!: Relation<EmpleadoOrmEntity>;
}
