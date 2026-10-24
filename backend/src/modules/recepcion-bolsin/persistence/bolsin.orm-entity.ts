import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
} from 'typeorm';
import { ComisionMedicaOrmEntity } from '../../organizacion/persistence/comision-medica.orm-entity';
import { CambioEstadoBolsinOrmEntity } from './cambio-estado-bolsin.orm-entity';
import { RemitoOrmEntity } from './remito.orm-entity';

@Entity('bolsin')
@Unique('uq_bolsin_numero_precinto', ['numeroPrecinto'])
export class BolsinOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_bolsin' })
  id!: number;

  @Column({ name: 'numero_precinto', type: 'integer' })
  numeroPrecinto!: number;

  @Column({ name: 'cm_origen_id', type: 'integer' })
  cmOrigenId!: number;

  @ManyToOne(() => ComisionMedicaOrmEntity)
  @JoinColumn({ name: 'cm_origen_id', foreignKeyConstraintName: 'fk_bolsin_cm_origen' })
  cmOrigen!: Relation<ComisionMedicaOrmEntity>;

  @Column({ name: 'cm_destino_id', type: 'integer' })
  cmDestinoId!: number;

  @ManyToOne(() => ComisionMedicaOrmEntity)
  @JoinColumn({ name: 'cm_destino_id', foreignKeyConstraintName: 'fk_bolsin_cm_destino' })
  cmDestino!: Relation<ComisionMedicaOrmEntity>;

  @OneToMany(() => RemitoOrmEntity, (remito) => remito.bolsin)
  remitos!: Relation<RemitoOrmEntity[]>;

  @OneToMany(() => CambioEstadoBolsinOrmEntity, (cambio) => cambio.bolsin)
  cambiosEstado!: Relation<CambioEstadoBolsinOrmEntity[]>;
}
