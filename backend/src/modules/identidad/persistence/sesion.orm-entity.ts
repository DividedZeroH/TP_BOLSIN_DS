import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UsuarioOrmEntity } from './usuario.orm-entity';

@Entity('sesion')
export class SesionOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_sesion' })
  id!: number;

  @Column({ name: 'usuario_id', type: 'integer' })
  usuarioId!: number;

  @ManyToOne(() => UsuarioOrmEntity)
  @JoinColumn({ name: 'usuario_id', foreignKeyConstraintName: 'fk_sesion_usuario' })
  usuario!: UsuarioOrmEntity;
}
