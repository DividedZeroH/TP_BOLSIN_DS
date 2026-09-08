import { Injectable } from '@nestjs/common';
import { ComisionMedica } from '../../../../organizacion';
import { Empleado } from '../../../domain/empleado';
import { Sesion } from '../../../domain/sesion';
import { Usuario } from '../../../domain/usuario';
import { ComisionMedicaRegistro } from '../registros/comision-medica.registro';
import { EmpleadoConComisionRegistro } from '../registros/empleado-con-comision.registro';
import { SesionConUsuarioRegistro } from '../registros/sesion-con-usuario.registro';

/**
 * Traduce filas de Prisma a las entidades de identidad.
 *
 * Cada subdominio define su propia representación persistente: por eso este
 * módulo tiene su `ComisionMedicaRegistro` y no comparte el de recepción de
 * bolsín, aunque la entidad `ComisionMedica` sí sea la misma (kernel).
 */
@Injectable()
export class IdentidadMapper {
  mapearComisionMedica(registro: ComisionMedicaRegistro): ComisionMedica {
    return new ComisionMedica(registro.id, registro.nombre);
  }

  mapearEmpleado(registro: EmpleadoConComisionRegistro): Empleado {
    return new Empleado(
      registro.id,
      this.mapearComisionMedica(registro.comisionMedica),
      registro.apellido,
      registro.email,
    );
  }

  /** Reconstruye la navegación Sesion -> Usuario -> Empleado del análisis. */
  mapearSesion(registro: SesionConUsuarioRegistro): Sesion {
    return new Sesion(
      registro.id,
      new Usuario(
        registro.usuario.id,
        this.mapearEmpleado(registro.usuario.empleado),
      ),
    );
  }
}
