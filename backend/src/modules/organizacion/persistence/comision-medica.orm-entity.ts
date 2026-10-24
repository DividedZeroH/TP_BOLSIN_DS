import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('comision_medica')
@Unique('uq_comision_medica_nombre', ['nombre'])
export class ComisionMedicaOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_comision_medica' })
  id!: number;

  @Column({ name: 'nombre', type: 'varchar' })
  nombre!: string;
}
