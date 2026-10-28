import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Estado } from '../../estados/entity/estado.entity';
import { Empleado } from '../../empleados/entity/empleado.entity';
import { Bolsin } from './bolsin.entity';

@Entity('cambio_estado_bolsin')
@Index('ix_cambio_estado_bolsin_actual', ['bolsinId', 'fechaHoraFin'])
export class CambioEstadoBolsin {
  @PrimaryGeneratedColumn({
    name: 'id',
    primaryKeyConstraintName: 'pk_cambio_estado_bolsin',
  })
  id!: number;

  @Column({ name: 'fecha_hora_inicio', type: 'timestamptz' })
  fechaHoraInicio!: Date;

  /** `null` = cambio actual (`sosActual()`). */
  @Column({ name: 'fecha_hora_fin', type: 'timestamptz', nullable: true })
  fechaHoraFin!: Date | null;

  @Column({ name: 'bolsin_id', type: 'integer' })
  bolsinId!: number;

  @ManyToOne(() => Bolsin, (bolsin) => bolsin.cambiosEstado)
  @JoinColumn({
    name: 'bolsin_id',
    foreignKeyConstraintName: 'fk_cambio_estado_bolsin_bolsin',
  })
  bolsin!: Relation<Bolsin>;

  @Index('ix_cambio_estado_bolsin_estado')
  @Column({ name: 'estado_id', type: 'integer' })
  estadoId!: number;

  @ManyToOne(() => Estado)
  @JoinColumn({
    name: 'estado_id',
    foreignKeyConstraintName: 'fk_cambio_estado_bolsin_estado',
  })
  estado!: Relation<Estado>;

  @Column({ name: 'responsable_id', type: 'integer' })
  responsableId!: number;

  @ManyToOne(() => Empleado)
  @JoinColumn({
    name: 'responsable_id',
    foreignKeyConstraintName: 'fk_cambio_estado_bolsin_responsable',
  })
  responsable!: Relation<Empleado>;
}
