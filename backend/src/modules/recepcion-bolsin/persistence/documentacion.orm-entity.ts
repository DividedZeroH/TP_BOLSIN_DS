import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ComisionMedicaOrmEntity } from '../../organizacion/persistence/comision-medica.orm-entity';
import { CambioEstadoDocumentacionOrmEntity } from './cambio-estado-documentacion.orm-entity';
import { TipoDocumentacionOrmEntity } from './tipo-documentacion.orm-entity';

/** Sin columna de estado: el estado se deriva de sus cambios. */
@Entity('documentacion')
export class DocumentacionOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_documentacion' })
  id!: number;

  @Column({ name: 'asunto', type: 'varchar' })
  asunto!: string;

  @Column({ name: 'tipo_documentacion_id', type: 'integer' })
  tipoDocumentacionId!: number;

  @ManyToOne(() => TipoDocumentacionOrmEntity)
  @JoinColumn({
    name: 'tipo_documentacion_id',
    foreignKeyConstraintName: 'fk_documentacion_tipo_documentacion',
  })
  tipoDocumentacion!: Relation<TipoDocumentacionOrmEntity>;

  @Column({ name: 'cm_origen_id', type: 'integer' })
  cmOrigenId!: number;

  @ManyToOne(() => ComisionMedicaOrmEntity)
  @JoinColumn({ name: 'cm_origen_id', foreignKeyConstraintName: 'fk_documentacion_cm_origen' })
  cmOrigen!: Relation<ComisionMedicaOrmEntity>;

  @OneToMany(() => CambioEstadoDocumentacionOrmEntity, (cambio) => cambio.documentacion)
  cambiosEstado!: Relation<CambioEstadoDocumentacionOrmEntity[]>;
}
