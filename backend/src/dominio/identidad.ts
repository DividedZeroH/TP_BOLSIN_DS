/** Entidad del modelo que identifica una comisión médica. */
export class ComisionMedica {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
  ) {}

  getNombre(): string {
    return this.nombre;
  }
}

/** Entidad que representa al responsable que realiza la recepción. */
export class Empleado {
  constructor(
    public readonly id: number,
    public readonly apellido: string,
    public readonly email: string,
    private readonly comisionMedica: ComisionMedica,
  ) {}

  getComisionMedica(): ComisionMedica {
    return this.comisionMedica;
  }
}

/** Usuario asociado al empleado, según la navegación del diagrama de secuencia. */
export class Usuario {
  constructor(
    public readonly id: number,
    private readonly empleado: Empleado,
  ) {}

  getEmpleado(): Empleado {
    return this.empleado;
  }
}

/** Sesión activa utilizada para obtener el usuario logueado. */
export class Sesion {
  constructor(
    public readonly id: number,
    private readonly usuarioLogueado: Usuario,
  ) {}

  getUsuarioLogueado(): Usuario {
    return this.usuarioLogueado;
  }
}
