import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entity/usuario.entity';

@Entity('sesion')
export class Sesion {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_sesion' })
  id!: number;

  @Column({ name: 'usuario_id', type: 'integer' })
  usuarioId!: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id', foreignKeyConstraintName: 'fk_sesion_usuario' })
  usuario!: Usuario;
}
