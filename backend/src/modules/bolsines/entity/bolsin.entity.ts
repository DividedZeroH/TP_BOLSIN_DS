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
import { ComisionMedica } from '../../comisiones-medicas/entity/comision-medica.entity';
import { CambioEstadoBolsin } from './cambio-estado-bolsin.entity';
import { Remito } from '../../remitos/entity/remito.entity';

@Entity('bolsin')
@Unique('uq_bolsin_numero_precinto', ['numeroPrecinto'])
export class Bolsin {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_bolsin' })
  id!: number;

  @Column({ name: 'numero_precinto', type: 'integer' })
  numeroPrecinto!: number;

  @Column({ name: 'cm_origen_id', type: 'integer' })
  cmOrigenId!: number;

  @ManyToOne(() => ComisionMedica)
  @JoinColumn({ name: 'cm_origen_id', foreignKeyConstraintName: 'fk_bolsin_cm_origen' })
  cmOrigen!: Relation<ComisionMedica>;

  @Column({ name: 'cm_destino_id', type: 'integer' })
  cmDestinoId!: number;

  @ManyToOne(() => ComisionMedica)
  @JoinColumn({ name: 'cm_destino_id', foreignKeyConstraintName: 'fk_bolsin_cm_destino' })
  cmDestino!: Relation<ComisionMedica>;

  @OneToMany(() => Remito, (remito) => remito.bolsin)
  remitos!: Relation<Remito[]>;

  @OneToMany(() => CambioEstadoBolsin, (cambio) => cambio.bolsin)
  cambiosEstado!: Relation<CambioEstadoBolsin[]>;
}
