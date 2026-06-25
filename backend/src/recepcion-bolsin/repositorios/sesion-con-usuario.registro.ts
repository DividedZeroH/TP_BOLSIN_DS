import { EmpleadoConComisionRegistro } from './empleado-con-comision.registro';

/** Resultado plano de buscar una sesión: sesión -> usuario -> empleado. */
export interface SesionConUsuarioRegistro {
  id: number;
  usuario: {
    id: number;
    empleado: EmpleadoConComisionRegistro;
  };
}
