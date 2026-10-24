import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
} from 'typeorm';
import { EstadoOrmEntity } from '../../catalogo/persistence/estado.orm-entity';
import { ComisionMedicaOrmEntity } from '../../organizacion/persistence/comision-medica.orm-entity';
import { BolsinOrmEntity } from './bolsin.orm-entity';
import { DetalleRemitoOrmEntity } from './detalle-remito.orm-entity';

@Entity('remito')
@Unique('uq_remito_numero', ['numero'])
export class RemitoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_remito' })
  id!: number;

  @Column({ name: 'numero', type: 'integer' })
  numero!: number;

  @Column({ name: 'bolsin_id', type: 'integer' })
  bolsinId!: number;

  @ManyToOne(() => BolsinOrmEntity, (bolsin) => bolsin.remitos)
  @JoinColumn({ name: 'bolsin_id', foreignKeyConstraintName: 'fk_remito_bolsin' })
  bolsin!: Relation<BolsinOrmEntity>;

  /** El diagrama asocia Remito directo a Estado: es el único estado asignable. */
  @Index('ix_remito_estado')
  @Column({ name: 'estado_id', type: 'integer' })
  estadoId!: number;

  @ManyToOne(() => EstadoOrmEntity)
  @JoinColumn({ name: 'estado_id', foreignKeyConstraintName: 'fk_remito_estado' })
  estado!: Relation<EstadoOrmEntity>;

  @Column({ name: 'cm_origen_id', type: 'integer' })
  cmOrigenId!: number;

  @ManyToOne(() => ComisionMedicaOrmEntity)
  @JoinColumn({ name: 'cm_origen_id', foreignKeyConstraintName: 'fk_remito_cm_origen' })
  cmOrigen!: Relation<ComisionMedicaOrmEntity>;

  @Column({ name: 'cm_destino_id', type: 'integer' })
  cmDestinoId!: number;

  @ManyToOne(() => ComisionMedicaOrmEntity)
  @JoinColumn({ name: 'cm_destino_id', foreignKeyConstraintName: 'fk_remito_cm_destino' })
  cmDestino!: Relation<ComisionMedicaOrmEntity>;

  @OneToMany(() => DetalleRemitoOrmEntity, (detalle) => detalle.remito)
  detalles!: Relation<DetalleRemitoOrmEntity[]>;
}
