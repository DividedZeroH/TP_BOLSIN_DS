import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Documentacion } from '../../documentaciones/entity/documentacion.entity';
import { Remito } from './remito.entity';

@Entity('detalle_remito')
export class DetalleRemito {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_detalle_remito' })
  id!: number;

  @Column({ name: 'remito_id', type: 'integer' })
  remitoId!: number;

  @ManyToOne(() => Remito, (remito) => remito.detalles)
  @JoinColumn({ name: 'remito_id', foreignKeyConstraintName: 'fk_detalle_remito_remito' })
  remito!: Relation<Remito>;

  @Column({ name: 'documentacion_id', type: 'integer' })
  documentacionId!: number;

  @ManyToOne(() => Documentacion)
  @JoinColumn({
    name: 'documentacion_id',
    foreignKeyConstraintName: 'fk_detalle_remito_documentacion',
  })
  documentacion!: Relation<Documentacion>;
}
