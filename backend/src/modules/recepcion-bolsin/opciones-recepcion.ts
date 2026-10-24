export const OPCION_CONTENIDO_IGUAL = 'CONTENIDO_IGUAL' as const;

export const OPCIONES_RECEPCION = [
  OPCION_CONTENIDO_IGUAL,
  'FALTA_DOCUMENTACION',
  'DOCUMENTACION_NO_CORRESPONDE',
  'REDIRIGIR_OTRA_AREA',
] as const;

export type CodigoOpcionRecepcion = (typeof OPCIONES_RECEPCION)[number];

export interface OpcionRecepcion {
  codigo: CodigoOpcionRecepcion;
  descripcion: string;
  implementado: boolean;
}

/**
 * Catálogo de situaciones de recepción. Es la única fuente de verdad de qué
 * opciones existen y cuáles están implementadas: la pantalla las recibe desde
 * acá y solo habilita las que `tomarOpcion()` va a aceptar.
 *
 * Las tres no implementadas corresponden a las ramas de `recibir()` hacia
 * `Rechazada`, `Redirigida` y `NoRecibida` (flujos A1–A6), fuera de alcance.
 */
export const MANEJADORES_OPCION_RECEPCION: Readonly<
  Record<CodigoOpcionRecepcion, OpcionRecepcion>
> = {
  CONTENIDO_IGUAL: {
    codigo: 'CONTENIDO_IGUAL',
    descripcion: 'El contenido del bolsín es igual al registrado.',
    implementado: true,
  },
  FALTA_DOCUMENTACION: {
    codigo: 'FALTA_DOCUMENTACION',
    descripcion:
      'No se recibe toda la documentación asociada a los remitos que contiene el bolsín.',
    implementado: false,
  },
  DOCUMENTACION_NO_CORRESPONDE: {
    codigo: 'DOCUMENTACION_NO_CORRESPONDE',
    descripcion:
      'Existe documentación que no corresponde al destino (CM del usuario logueado).',
    implementado: false,
  },
  REDIRIGIR_OTRA_AREA: {
    codigo: 'REDIRIGIR_OTRA_AREA',
    descripcion: 'La documentación se debe redirigir a otra área.',
    implementado: false,
  },
};
