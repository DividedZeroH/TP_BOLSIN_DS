export interface UsuarioLogueadoVista {
  id: number;
  apellido?: string;
  email?: string;
}

export interface ComisionMedicaVista {
  id: number;
  nombre: string;
}

/** `GET /sesiones/:id/comision-medica`. */
export interface SesionVista {
  usuarioLogueado: UsuarioLogueadoVista;
  comisionMedica: ComisionMedicaVista;
}
