import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ComisionMedica } from '../../comisiones-medicas/entity/comision-medica.entity';
import { CambioEstadoDocumentacion } from './cambio-estado-documentacion.entity';
import { TipoDocumentacion } from './tipo-documentacion.entity';

/** Sin columna de estado: el estado se deriva de sus cambios. */
@Entity('documentacion')
export class Documentacion {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_documentacion' })
  id!: number;

  @Column({ name: 'asunto', type: 'varchar' })
  asunto!: string;

  @Column({ name: 'tipo_documentacion_id', type: 'integer' })
  tipoDocumentacionId!: number;

  @ManyToOne(() => TipoDocumentacion)
  @JoinColumn({
    name: 'tipo_documentacion_id',
    foreignKeyConstraintName: 'fk_documentacion_tipo_documentacion',
  })
  tipoDocumentacion!: Relation<TipoDocumentacion>;

  @Column({ name: 'cm_origen_id', type: 'integer' })
  cmOrigenId!: number;

  @ManyToOne(() => ComisionMedica)
  @JoinColumn({
    name: 'cm_origen_id',
    foreignKeyConstraintName: 'fk_documentacion_cm_origen',
  })
  cmOrigen!: Relation<ComisionMedica>;

  @OneToMany(() => CambioEstadoDocumentacion, (cambio) => cambio.documentacion)
  cambiosEstado!: Relation<CambioEstadoDocumentacion[]>;
}
