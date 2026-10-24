import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ComisionMedicaOrmEntity } from '../../organizacion/persistence/comision-medica.orm-entity';

@Entity('empleado')
@Unique('uq_empleado_email', ['email'])
export class EmpleadoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_empleado' })
  id!: number;

  @Column({ name: 'apellido', type: 'varchar' })
  apellido!: string;

  @Column({ name: 'email', type: 'varchar' })
  email!: string;

  @Column({ name: 'comision_medica_id', type: 'integer' })
  comisionMedicaId!: number;

  @ManyToOne(() => ComisionMedicaOrmEntity)
  @JoinColumn({ name: 'comision_medica_id', foreignKeyConstraintName: 'fk_empleado_comision_medica' })
  comisionMedica!: ComisionMedicaOrmEntity;
}
