import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { DocumentacionOrmEntity } from './documentacion.orm-entity';
import { RemitoOrmEntity } from './remito.orm-entity';

@Entity('detalle_remito')
export class DetalleRemitoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_detalle_remito' })
  id!: number;

  @Column({ name: 'remito_id', type: 'integer' })
  remitoId!: number;

  @ManyToOne(() => RemitoOrmEntity, (remito) => remito.detalles)
  @JoinColumn({ name: 'remito_id', foreignKeyConstraintName: 'fk_detalle_remito_remito' })
  remito!: Relation<RemitoOrmEntity>;

  @Column({ name: 'documentacion_id', type: 'integer' })
  documentacionId!: number;

  @ManyToOne(() => DocumentacionOrmEntity)
  @JoinColumn({
    name: 'documentacion_id',
    foreignKeyConstraintName: 'fk_detalle_remito_documentacion',
  })
  documentacion!: Relation<DocumentacionOrmEntity>;
}
