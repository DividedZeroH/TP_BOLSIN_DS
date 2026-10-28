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
import { Estado } from '../../estados/entity/estado.entity';
import { ComisionMedica } from '../../comisiones-medicas/entity/comision-medica.entity';
import { Bolsin } from '../../bolsines/entity/bolsin.entity';
import { DetalleRemito } from './detalle-remito.entity';

@Entity('remito')
@Unique('uq_remito_numero', ['numero'])
export class Remito {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_remito' })
  id!: number;

  @Column({ name: 'numero', type: 'integer' })
  numero!: number;

  @Column({ name: 'bolsin_id', type: 'integer' })
  bolsinId!: number;

  @ManyToOne(() => Bolsin, (bolsin) => bolsin.remitos)
  @JoinColumn({ name: 'bolsin_id', foreignKeyConstraintName: 'fk_remito_bolsin' })
  bolsin!: Relation<Bolsin>;

  /** El diagrama asocia Remito directo a Estado: es el único estado asignable. */
  @Index('ix_remito_estado')
  @Column({ name: 'estado_id', type: 'integer' })
  estadoId!: number;

  @ManyToOne(() => Estado)
  @JoinColumn({ name: 'estado_id', foreignKeyConstraintName: 'fk_remito_estado' })
  estado!: Relation<Estado>;

  @Column({ name: 'cm_origen_id', type: 'integer' })
  cmOrigenId!: number;

  @ManyToOne(() => ComisionMedica)
  @JoinColumn({ name: 'cm_origen_id', foreignKeyConstraintName: 'fk_remito_cm_origen' })
  cmOrigen!: Relation<ComisionMedica>;

  @Column({ name: 'cm_destino_id', type: 'integer' })
  cmDestinoId!: number;

  @ManyToOne(() => ComisionMedica)
  @JoinColumn({ name: 'cm_destino_id', foreignKeyConstraintName: 'fk_remito_cm_destino' })
  cmDestino!: Relation<ComisionMedica>;

  @OneToMany(() => DetalleRemito, (detalle) => detalle.remito)
  detalles!: Relation<DetalleRemito[]>;
}
