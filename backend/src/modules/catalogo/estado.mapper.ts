import { AmbitoEstado, Estado } from './domain/estado';
import { EstadoOrmEntity } from './persistence/estado.orm-entity';

export function estadoADominio(orm: EstadoOrmEntity): Estado {
  return new Estado(orm.id, orm.nombre, orm.ambito as AmbitoEstado);
}
