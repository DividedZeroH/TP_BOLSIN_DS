import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { EmpleadoOrmEntity } from './empleado.orm-entity';

@Entity('usuario')
@Unique('uq_usuario_empleado', ['empleadoId'])
export class UsuarioOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_usuario' })
  id!: number;

  @Column({ name: 'empleado_id', type: 'integer' })
  empleadoId!: number;

  @OneToOne(() => EmpleadoOrmEntity)
  @JoinColumn({ name: 'empleado_id', foreignKeyConstraintName: 'fk_usuario_empleado' })
  empleado!: EmpleadoOrmEntity;
}
