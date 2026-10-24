import { comisionMedicaADominio } from '../organizacion/comision-medica.mapper';
import { Empleado } from './domain/empleado';
import { Sesion } from './domain/sesion';
import { Usuario } from './domain/usuario';
import { EmpleadoOrmEntity } from './persistence/empleado.orm-entity';
import { SesionOrmEntity } from './persistence/sesion.orm-entity';

/** Relaciones necesarias para recorrer Sesion -> Usuario -> Empleado -> ComisionMedica. */
export const RELACIONES_SESION = { usuario: { empleado: { comisionMedica: true } } } as const;

/** Requiere `empleado.comisionMedica` cargada. */
export function empleadoADominio(orm: EmpleadoOrmEntity): Empleado {
  return new Empleado(orm.id, comisionMedicaADominio(orm.comisionMedica), orm.apellido, orm.email);
}

export function sesionADominio(orm: SesionOrmEntity): Sesion {
  return new Sesion(orm.id, new Usuario(orm.usuario.id, empleadoADominio(orm.usuario.empleado)));
}
