import { ComisionMedica } from './domain/comision-medica';
import { ComisionMedicaOrmEntity } from './persistence/comision-medica.orm-entity';

export function comisionMedicaADominio(orm: ComisionMedicaOrmEntity): ComisionMedica {
  return new ComisionMedica(orm.id, orm.nombre);
}
