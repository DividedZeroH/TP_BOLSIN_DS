export type AmbitoEstado = 'BOLSIN' | 'REMITO' | 'DOCUMENTACION';

import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('estado')
@Unique('uq_estado_nombre_ambito', ['nombre', 'ambito'])
export class Estado {
  @PrimaryGeneratedColumn({ name: 'id', primaryKeyConstraintName: 'pk_estado' })
  id!: number;

  @Column({ name: 'nombre', type: 'varchar' })
  nombre!: string;

  /** `BOLSIN` | `REMITO` | `DOCUMENTACION`. */
  @Column({ name: 'ambito', type: 'varchar' })
  ambito!: AmbitoEstado;
}
