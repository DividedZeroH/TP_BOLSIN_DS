import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('tipo_documentacion')
@Unique('uq_tipo_documentacion_nombre', ['nombre'])
export class TipoDocumentacion {
  @PrimaryGeneratedColumn({
    name: 'id',
    primaryKeyConstraintName: 'pk_tipo_documentacion',
  })
  id!: number;

  @Column({ name: 'nombre', type: 'varchar' })
  nombre!: string;
}
