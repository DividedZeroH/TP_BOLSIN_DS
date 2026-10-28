import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Empleado } from '../../empleados/entity/empleado.entity';

@Entity('usuario')
@Unique('uq_usuario_empleado', ['empleadoId'])
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_usuario' })
  id!: number;

  @Column({ name: 'empleado_id', type: 'integer' })
  empleadoId!: number;

  @OneToOne(() => Empleado)
  @JoinColumn({ name: 'empleado_id', foreignKeyConstraintName: 'fk_usuario_empleado' })
  empleado!: Empleado;
}
