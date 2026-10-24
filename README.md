---
title: "Trabajo Práctico Integrador PPAI - Sistema de Recepción de Bolsines (DSI)"
unit: "Trabajo Práctico PPAI"
tags:
  - diseño-sistemas/tp-integrador
  - proyecto/ppai-bolsin
  - arquitectura/nest-angular
  - persistencia/typeorm-postgres
  - grasp
aliases:
  - TP Bolsín DS
  - PPAI Recepción Bolsín
date: 2026-08-20
---

# TP_BOLSIN_DS

Registrar recepción de bolsín — implementación web del flujo normal del CU 28, construida a partir del diagrama
de clases, el diagrama de secuencia, la máquina de estados y la plantilla
funcional suministrados (Entrega 1, PPAI 2026, Grupo 6).

## Tecnologías

- Lenguaje: TypeScript.
- Backend: NestJS.
- Persistencia: TypeORM + PostgreSQL 16 (Docker Compose).
- Frontend: Angular standalone.
- Tecnología: Web.

Las clases `PantallaRegistrarRecepcionBolsin` (Boundary),
`GestorRegistrarRecepcionBolsin` (Control) y las entidades del dominio conservan
los nombres y responsabilidades del modelo. Los identificadores, DTO, controlador
HTTP y adaptador de API son elementos técnicos necesarios para implementarlo como
aplicación web.

## Modelo de dominio

El agregado central es **Bolsin**, que delega en cascada según el diagrama de
clases del análisis: `Bolsin -> Remito -> DetalleRemito -> Documentacion`. Cada
entidad que tiene ciclo de vida propio (Bolsin, Documentacion) lo expresa como
una lista de cambios de estado con fecha de inicio/fin (`CambioEstadoBolsin`,
`CambioEstadoDocumentacion`), nunca como un campo de estado mutable suelto — el
estado "actual" es siempre el cambio cuyo `fechaHoraFin` es `null`
(`sosActual()`). `Estado` es un catálogo único (`Nombre` + `Ambito`) compartido
por Bolsin, Remito y Documentacion, consultado mediante predicados de dominio
(`sosEnviado()`, `sosRecibido()`, `sosAmbitoBolsin()`, etc.) en vez de comparar
strings sueltos fuera de la entidad — es el patrón Expert del diagrama aplicado
literalmente.

`Empleado`, `ComisionMedica`, `Sesion` y `Usuario` son transversales: cualquier
caso de uso futuro los necesita para saber quién está logueado y a qué comisión
pertenece, por eso viven en sus propios módulos (`identidad`, `organizacion`) y
no dentro del módulo de un único CU.

```mermaid
classDiagram
    class PantallaRegistrarRecepcionBolsin {
        <<Boundary>>
        +registrarRecepcionBolsin()
        +abrirVentana()
        +mostrarComisionMedicaUsuario()
        +mostrarDatosBolsinesParaSeleccion()
        +tomarBolsin()
        +mostrarDocumentacionBolsin()
        +mostrarOpcionesRecepcionParaSeleccion()
        +tomarOpcion()
        +pedirConfirmacion()
        +tomarConfirmacion()
        +informarEjecucionExitosa()
    }
    class GestorRegistrarRecepcionBolsin {
        <<Control>>
        +nuevaRecepcionBolsin()
        +buscarUsuarioLogueado()
        +buscarComisionMedicaUsuario()
        +buscarBolsinEnviadoCMUsuario()
        +validarComisionMedicaBolsin()
        +buscarPrecintoBolsin()
        +buscarComisionMedicaBolsin()
        +tomarBolsin()
        +buscarRemitoBolsin()
        +buscarDocumentacionBolsin()
        +tomarOpcion()
        +tomarConfirmacion()
        +buscarEstadoRecibidoBolsin()
        +getFechaHoraActual()
        +registrarCambioEstadoBolsin()
        +buscarEstadoRecibidoYAceptado()
        +actualizarEstadoRemito()
        +actualizarDocumentacion()
        +llamarCU29()
        +finDelCU()
    }
    class Sesion { +getUsuarioLogueado() }
    class Usuario { +getEmpleado() }
    class Empleado {
        +apellido
        +email
        +getComisionMedica()
    }
    class ComisionMedica {
        +nombre
        +getNombre()
    }
    class Estado {
        +nombre
        +ambito
        +sosEnviado()
        +sosRecibido()
        +sosRecibidoYAceptado()
        +sosAmbitoBolsin()
        +sosAmbitoRemito()
        +sosAmbitoDocumentacion()
    }
    class Bolsin {
        +numeroPrecinto
        +sosEnviado()
        +obtenerTuCMDestino()
        +obtenerCMOrigen()
        +getNumeroPrecinto()
        +buscarRemitoBolsin()
        +buscarDocumentacionBolsin()
        +registrarCambioEstadoBolsin()
        +actualizarEstadoRemito()
        +actualizarDocumentacion()
        +getEstadoActual()
        +crearCambioEstado()
    }
    class CambioEstadoBolsin {
        +fechaHoraInicio
        +fechaHoraFin
        +sosActual()
        +sosEnviado()
        +setFechaHoraFin()
    }
    class Remito {
        +numero
        +getNumero()
        +buscarDocumentacion()
        +actualizarDocumentacion()
        +recibidoAceptado()
        +setEstado()
    }
    class DetalleRemito {
        +buscarDocumentacion()
        +actualizarDocumentacion()
    }
    class Documentacion {
        +asunto
        +getAsunto()
        +mostrarTipoDocumentacion()
        +recibir()
        +getEstadoActual()
        +crearCambioEstado()
        +revision()
        +darDeBaja()
        +actualizarAsignacionDeRemito()
        +actualizarAsignacionDeBolsin()
        +retirarDeBolsin()
    }
    class TipoDocumentacion { +nombre +getNombre() }
    class CambioEstadoDocumentacion {
        +fechaHoraInicio
        +fechaHoraFin
        +sosActual()
        +setFechaHoraFin()
    }

    PantallaRegistrarRecepcionBolsin ..> GestorRegistrarRecepcionBolsin : crea
    GestorRegistrarRecepcionBolsin ..> Sesion : consulta
    Sesion "1" --> "1" Usuario
    Usuario "1" --> "1" Empleado
    Empleado "1" --> "1" ComisionMedica : AsignadoA
    ComisionMedica "1" --> "*" Bolsin : origen / destino
    ComisionMedica "1" --> "*" Remito : origen / destino
    ComisionMedica "1" --> "*" Documentacion : CMorigen
    Bolsin "1" --> "1..*" Remito
    Bolsin "1" --> "1..*" CambioEstadoBolsin : CEBolsin
    Remito "1" --> "1..*" DetalleRemito
    DetalleRemito "1..*" --> "1" Documentacion
    Documentacion "1" --> "1" TipoDocumentacion
    Documentacion "1" --> "1..*" CambioEstadoDocumentacion : CEDocumentacion
    CambioEstadoBolsin "*" --> "1" Estado
    CambioEstadoDocumentacion "*" --> "1" Estado
    Remito "*" --> "1" Estado
    CambioEstadoBolsin "*" --> "1" Empleado : ResponsableCE
    CambioEstadoDocumentacion "*" --> "1" Empleado : ResponsableCE
```

> Reconstruido a partir de `DiagramaClasesAnalisis.png` (la vista curada y
> entregada) y verificado contra `DiagramaClasesVistaEstaticaPPAI.mdj`, el
> modelo StarUML completo. El `.mdj` es más amplio que lo entregado: incluye
> clases y atributos de otros trabajos/vistas no usados en este CU
> (`Provincia`, `Localidad`, `Rol`, `Archivo`, superclases genéricas `Pantalla`/
> `Gestor`) y algunos atributos duplicados por ediciones sucesivas
> (`numeroPrecinto` repetido, `SosActual`/`sosActual` como variantes). El
> diagrama de arriba usa la vista curada (PNG), que es la que coincide
> método a método con el código.

## Máquina de estados de `Documentacion`

```mermaid
stateDiagram-v2
    [*] --> Registrado : 7 Registrar Documentación / new()
    Registrado --> EnBaja : 9 Eliminar Documentación / darDeBaja()
    Registrado --> EnRemito : 15 Generar Remito · 16 Modificar Remito / actualizarAsignacionDeRemito()
    EnRemito --> Registrado : 16 Modificar Remito · 17 Cancelar Remito / actualizarAsignacionDeRemito()
    EnRemito --> EnBolsinSaliente : 19 Generar Bolsín · 20 Modificar Bolsín / actualizarAsignacionDeBolsin()
    EnBolsinSaliente --> EnRemito : 20 Modificar Bolsín [SeQuitaDocumentacion=sí] · 21 Eliminar Bolsín / actualizarAsignacionDeBolsin()
    EnBolsinSaliente --> EnBolsinSaliente : 20 Modificar Bolsín [SeQuitaDocumentacion=no] / actualizarAsignacionDeBolsin()
    EnBolsinSaliente --> EnBolsinEnviado : 27 Registrar el retiro de bolsines / retirarDeBolsin()
    EnBolsinEnviado --> NoRecibida : 28 Registrar recepción de bolsín [Recibido=no] / recibir()
    EnBolsinEnviado --> Redirigida : 28 Registrar recepción de bolsín [CM=CMC y Recibido=sí] / recibir()
    EnBolsinEnviado --> Aceptada : 28 Registrar recepción de bolsín [CM!=CMC y ContenidoCompleto=sí y Recibido=sí] / recibir()
    EnBolsinEnviado --> Rechazada : 28 Registrar recepción de bolsín [CM!=CMC y ContenidoCompleto=no y Recibido=sí] / recibir()
    Redirigida --> Aceptada : 28 Registrar recepción de bolsín [ContenidoCompleto=sí] / recibir()
    Redirigida --> Rechazada : 28 Registrar recepción de bolsín [ContenidoCompleto=no] / recibir()
    NoRecibida --> Registrado : 31 Registrar Revisión de Documentación [DocumentoRelevante=sí] / revision()
    NoRecibida --> EnBaja : 31 Registrar Revisión de Documentación [DocumentoRelevante=no] / revision()
    Aceptada --> Registrado : 31 Registrar Revisión de Documentación / revision()
    EnBaja --> [*]

    note right of Aceptada
        Única rama de "28 Registrar recepción de
        bolsín" implementada en el código
        (opción CONTENIDO_IGUAL).
    end note
    note right of Redirigida
        Redirigida, Rechazada y NoRecibida no
        existen como Estado en el seed ni en
        ningún código del backend: son las 3
        opciones de UI aún no implementadas.
    end note
```

Esta máquina explica por qué el frontend ofrece 4 "opciones de recepción"
(`recepcion-bolsin.component.ts`) pero el backend solo acepta una
(`opcion-recepcion.handlers.ts`, `manejador-opcion-recepcion.ts`): las otras 3
se corresponden con las ramas guardadas de `Recibir()` hacia `Redirigida`,
`Rechazada` y `NoRecibida`, que nunca llegaron a implementarse — ver
[Limitaciones conocidas](#limitaciones-conocidas--fuera-de-alcance).

## Caso de uso CU28 — diagrama de secuencia (flujo normal)

```mermaid
sequenceDiagram
    actor EB as Encargado de Bolsín
    participant Pantalla as :PantallaRegistrarRecepcionBolsin
    participant Gestor as :GestorRegistrarRecepcionBolsin
    participant Sesion as ActivaSesion:Sesion
    participant Usuario as Logueado:Usuario
    participant Empleado as Logueado:Empleado
    participant CM as :ComisionMedica
    participant Bolsin as :Bolsin
    participant CEBolsin as :CambioEstadoBolsin
    participant CEBolsinAct as Actual:CambioEstadoBolsin
    participant Estado as :Estado
    participant BolsinSel as Seleccionado:Bolsin
    participant Remito as :Remito
    participant DetRemito as :DetalleRemito
    participant Doc as :Documentacion
    participant TipoDoc as :TipoDocumentacion
    participant RemitoSel as Seleccionado:Remito
    participant DetRemitoSel as Seleccionado:DetalleRemito
    participant DocSel as Seleccionado:Documentacion
    participant CEDoc as :CambioEstadoDocumentacion
    participant CEDocAct as Actual:CambioEstadoDocumentacion

    EB->>Pantalla: registrarRecepcionBolsin()
    activate Pantalla
    Pantalla->>Pantalla: abrirVentana()
    Pantalla-->>Gestor: «create»
    Pantalla->>Gestor: nuevaRecepcionBolsin()
    activate Gestor

    Gestor->>Gestor: buscarUsuarioLogueado()
    Gestor->>Sesion: getUsuarioLogueado()
    Sesion->>Usuario: getEmpleado()

    Gestor->>Gestor: buscarComisionMedicaUsuario()
    Gestor->>Empleado: getComisionMedica()
    Empleado->>CM: getNombre()

    Gestor-->>Pantalla: mostrarComisionMedicaUsuario()

    Gestor->>Gestor: buscarBolsinEnviadoCMUsuario()
    loop LoopBolsin [MientrasHayaBolsin]
        Gestor->>Bolsin: sosEnviado()
        Bolsin->>CEBolsin: *sosActual()
        CEBolsin->>CEBolsinAct: sosEnviado()
        CEBolsinAct->>Estado: sosEnviado()
        Gestor->>Bolsin: obtenerTuCMDestino()
    end
    Gestor->>Gestor: validarComisionMedicaBolsin()

    Gestor->>Gestor: buscarPrecintoBolsin()
    loop LoopBolsinPrecinto [MientrasHayaBolsinValidado]
        Gestor->>Bolsin: getNumeroPrecinto()
    end

    Gestor->>Gestor: buscarComisionMedicaBolsin()
    loop LoopBolsinCM [MientrasHayaBolsinValidado]
        Gestor->>Bolsin: obtenerCMOrigen()
        Bolsin->>CM: getNombre()
    end

    Gestor-->>Pantalla: mostrarDatosBolsinesParaSeleccion()
    deactivate Gestor

    EB->>Pantalla: tomarBolsin()
    Pantalla->>Gestor: tomarBolsin()
    activate Gestor
    Gestor->>Gestor: buscarRemitoBolsin()
    Gestor->>BolsinSel: buscarRemitoBolsin()
    BolsinSel->>Remito: *getNumero()

    Gestor->>Gestor: buscarDocumentacionBolsin()
    Gestor->>BolsinSel: buscarDocumentacionBolsin()
    BolsinSel->>Remito: buscarDocumentacion()
    loop LoopDetalleRemito [MientrasHayaDetalleRemito]
        Remito->>DetRemito: buscarDocumentacion()
        DetRemito->>Doc: mostrarTipoDocumentacion()
        Doc->>TipoDoc: getNombre()
        DetRemito->>Doc: getAsunto()
    end

    Gestor-->>Pantalla: mostrarDocumentacionBolsin()
    Gestor-->>Pantalla: mostrarOpcionesRecepcionParaSeleccion()
    deactivate Gestor

    EB->>Pantalla: tomarOpcion()
    Pantalla->>Gestor: tomarOpcion()
    activate Gestor
    Gestor->>Gestor: tomarOpcion()
    Gestor-->>Pantalla: pedirConfirmacion()
    deactivate Gestor

    EB->>Pantalla: tomarConfirmacion()
    Pantalla->>Gestor: tomarConfirmacion()
    activate Gestor
    Gestor->>Gestor: tomarConfirmacion()

    Gestor->>Gestor: buscarEstadoRecibidoBolsin()
    Gestor->>Estado: *sosAmbitoBolsin()
    Gestor->>Estado: *sosRecibido()

    Gestor->>Gestor: getFechaHoraActual()

    Gestor->>Gestor: registrarCambioEstadoBolsin()
    Gestor->>BolsinSel: registrarCambioEstadoBolsin()
    BolsinSel->>CEBolsinAct: getEstadoActual()
    BolsinSel->>CEBolsinAct: setFechaHoraFin()
    BolsinSel->>CEBolsin: crearCambioEstado()
    CEBolsin-->>CEBolsinAct: new() «Recibido:CambioEstadoBolsin»

    Gestor->>Gestor: buscarEstadosRecibidoYAceptado()
    Gestor->>Estado: *sosAmbitoRemito()
    Gestor->>Estado: *sosAmbitoDocumentacion()
    Gestor->>Estado: *sosRecibidoYAceptado()

    Gestor->>Gestor: actualizarEstadoRemito()
    Gestor->>BolsinSel: actualizarEstadoRemito()
    loop RemitoRecibidoYAceptado [MientrasHayaRemito]
        BolsinSel->>RemitoSel: recibidoAceptado()
        RemitoSel->>RemitoSel: setEstado()
    end

    Gestor->>Gestor: actualizarDocumentacion()
    Gestor->>BolsinSel: actualizarDocumentacion()
    loop LoopRemitoActualizar [MientrasHayaRemito]
        BolsinSel->>RemitoSel: actualizarDocumentacion()
        loop LoopDetalleRemito [MientrasHayaDetalleRemito]
            RemitoSel->>DetRemitoSel: actualizarDocumentacion()
            DetRemitoSel->>DocSel: recibir()
            DocSel->>CEDocAct: getEstadoActual()
            DocSel->>CEDocAct: *sosActual()
            DocSel->>CEDocAct: setFechaHoraFin()
            DocSel->>CEDoc: crearCambioEstado()
            CEDoc-->>CEDocAct: new() «RecibidoYAceptado:CambioEstadoDocumentacion»
        end
    end

    Gestor->>Gestor: llamarCU29()
    Note right of Gestor: «include» 29. Notificar Recepción de Bolsín

    Gestor-->>Pantalla: informarEjecucionExitosa()
    Gestor->>Gestor: finDelCU()
    deactivate Gestor
    Pantalla-->>EB: (fin)
    deactivate Pantalla
    destroy Gestor
    destroy Pantalla
```

> Transcripto desde `DiagramaSecuencia_G6.png`, el export visual de
> `DiagramaSecuenciaPPAI.eapx`. El `.eapx` es una base Microsoft Access
> (formato propietario de Enterprise Architect) y no se puede leer como texto;
> este Mermaid es una reconstrucción fiel leyendo la imagen exportada, no un
> parseo del binario.

## Arquitectura del backend

NestJS clásico, organizado por **módulos de dominio**. Cada request recorre
siempre el mismo camino:

```
controller  →  service (gestor)  →  repositorio TypeORM  →  PostgreSQL
                    │
                    └── entidades de dominio (TypeScript puro)
```

```
backend/src/
├── main.ts / configurar-app.ts   # prefijo /api, ValidationPipe global, CORS
├── app.module.ts
├── database/
│   ├── configuracion.ts          # lee .env (DATABASE_URL / TEST_DATABASE_URL)
│   ├── database.module.ts        # @Global(), TypeOrmModule.forRootAsync, synchronize: false
│   ├── data-source.ts            # DataSource de la CLI (migraciones) y del seed
│   ├── migrations/               # única forma de cambiar el esquema
│   └── seeds/seed.ts             # escenario de demo, idempotente
└── modules/
    ├── recepcion-bolsin/         # CU28
    │   ├── recepcion-bolsin.controller.ts
    │   ├── gestor-registrar-recepcion-bolsin.service.ts
    │   ├── recepcion-en-curso.store.ts   # pasos con estado, en memoria
    │   ├── notificador-cu29.service.ts   # <<include>> CU29 (solo log)
    │   ├── opciones-recepcion.ts         # catálogo de las 4 situaciones
    │   ├── bolsin.mapper.ts              # ORM -> dominio
    │   ├── dto/                          # solicitudes (class-validator) y respuestas
    │   ├── persistence/                  # *.orm-entity.ts (decoradores de TypeORM)
    │   └── domain/                       # Bolsin, Remito, DetalleRemito, Documentacion, ...
    ├── identidad/                # Sesion -> Usuario -> Empleado; SesionService y SesionController
    ├── catalogo/                 # Estado y EstadoService
    └── organizacion/             # ComisionMedica (solo dominio, entidad ORM y mapper)
```

- **`domain/` es TypeScript puro.** Las clases del diagrama no tienen
  decoradores, ni de Nest ni de TypeORM. Las tablas se describen aparte, en
  `persistence/*.orm-entity.ts`, y los mappers (`bolsin.mapper.ts`,
  `sesion.mapper.ts`, `estado.mapper.ts`) reconstruyen el agregado de dominio
  a partir de las entidades ORM cargadas con `relations` explícitas.
- **El gestor es un `@Injectable()` común.** Inyecta
  `Repository<BolsinOrmEntity>`, `DataSource`, `SesionService` y
  `EstadoService`, y lanza `NotFoundException` / `BadRequestException`. Tiene
  un método por mensaje del diagrama de secuencia, en el mismo orden.
- **Confirmación atómica.** `tomarConfirmacion()` corre dentro de
  `dataSource.transaction(...)`. Primero bloquea el bolsín
  (`SELECT … FOR UPDATE`) y lo relee. Después el dominio aplica las reglas
  (`registrarCambioEstadoBolsin`, `actualizarEstadoRemito`,
  `actualizarDocumentacion`) y recién ahí se persisten los cambios: se cierra
  el cambio actual (`fecha_hora_fin`) y se inserta el nuevo con su
  responsable. El CU29 se notifica después del commit.
- **Recepción en curso.** La secuencia exige cuatro mensajes con estado
  (`nuevaRecepcionBolsin` → `tomarBolsin` → `tomarOpcion` →
  `tomarConfirmacion`). Lo tomado entre uno y otro vive en
  `RecepcionEnCursoStore`, un `Map` en memoria keyed por `recepcionId` (UUID)
  con TTL de 30 minutos. No va en campos del gestor porque el gestor es
  singleton y mezclaría usuarios. Los pasos fuera de orden responden 400.

### API

| Mensaje de la secuencia | Endpoint | Body |
|---|---|---|
| `nuevaRecepcionBolsin()` | `POST /api/recepciones-bolsines` | `{ sesionId }` |
| (rehidratar pantalla) | `GET /api/recepciones-bolsines/:recepcionId` | — |
| `tomarBolsin()` | `POST /api/recepciones-bolsines/:recepcionId/bolsin` | `{ numeroPrecinto }` |
| `tomarOpcion()` → `pedirConfirmacion()` | `POST /api/recepciones-bolsines/:recepcionId/opcion` | `{ codigo }` |
| `tomarConfirmacion()` → `finDelCU()` | `POST /api/recepciones-bolsines/:recepcionId/confirmacion` | `{}` |
| cancelar | `DELETE /api/recepciones-bolsines/:recepcionId` | — (204) |
| panel | `GET /api/sesiones/:id/comision-medica` | — |

## Cómo se hace cumplir la arquitectura

- **Una sola regla de ESLint** (`eslint.config.mjs`): nada dentro de
  `backend/src/**/domain/**` puede importar `typeorm` ni `@nestjs/*`. El
  mensaje del error explica dónde va cada cosa.
- **Tests de integración y e2e contra Postgres real.** Recorren el flujo
  completo y los casos de error, y verifican en la base que el bolsín quedó
  `Recibido`, los remitos `RecibidoYAceptado` y la documentación `Aceptada`,
  con los cambios anteriores cerrados.

## Trazabilidad: hallazgos de coherencia entre diagramas y código

1. **La máquina de estados explica el alcance real de las "opciones" de
   recepción.** Solo la rama que termina en `Aceptada` existe en el backend:
   el seed crea únicamente `EnBolsinEnviado` y `Aceptada` para
   `DOCUMENTACION`. `Redirigida`, `Rechazada` y `NoRecibida` no aparecen en
   ningún lado del código.
2. **Getters fuera del diagrama.** Para persistir el agregado después de que
   el dominio aplica la regla, `Bolsin` y `Documentacion` exponen
   `getCambiosEstado()` y `Remito` expone `getEstado()`. No figuran en el
   diagrama de clases. Son de solo lectura y no cambian ningún comportamiento
   modelado.
3. **`buscarEstadosRecibidoYAceptado()`** se nombra como en el diagrama de
   secuencia (en plural) y devuelve el estado del remito y el de la
   documentación. El diagrama de clases lo escribe en singular.
4. `nuevaRecepcionBolsin()` usa los métodos del dominio igual que los loops
   `LoopBolsin` / `LoopBolsinPrecinto` / `LoopBolsinCM` de la secuencia:
   `sosEnviado()`, `obtenerTuCMDestino()`, `getNumeroPrecinto()` y
   `obtenerCMOrigen()`.

## Limitaciones conocidas / fuera de alcance

- Solo se implementó la opción **"El contenido del bolsín es igual al
  registrado"** (`CONTENIDO_IGUAL`). Las otras 3 (`FALTA_DOCUMENTACION`,
  `DOCUMENTACION_NO_CORRESPONDE`, `REDIRIGIR_OTRA_AREA`) se publican en
  `opciones-recepcion.ts` con `implementado: false` y el gestor las rechaza
  con 400. La pantalla las muestra deshabilitadas con la etiqueta "No
  implementado", y es el backend el que dice cuáles están habilitadas.
- Los flujos alternativos A1–A6 quedan fuera de alcance.
- **CU29** no está modelado: `NotificadorCU29Service` solo deja constancia en
  el log.
- No hay autenticación: el frontend usa siempre la sesión `1`. La URL del
  backend está fija en el service de Angular.
- **La recepción en curso vive en memoria:** se pierde al reiniciar el
  backend y no sirve con más de una instancia.
- **El gestor está acoplado a TypeORM:** no hay tests unitarios puros del
  flujo. Se testea contra Postgres real (integración y e2e). Los tests de
  dominio sí son unitarios puros.
- **Hace falta Docker** para desarrollar y correr los tests. No hay modo
  SQLite ni base embebida.
- El listado inicial reconstruye el agregado completo de cada bolsín para que
  el dominio responda `sosEnviado()`. Con el volumen del TP es irrelevante.

## Fuente de los diagramas

Los tres PNG y los archivos de modelado (`DiagramaClasesVistaEstaticaPPAI.mdj`
de StarUML, `DiagramaSecuenciaPPAI.eapx` de Enterprise Architect) están en la
carpeta de Drive de la Entrega 1 del grupo. Los diagramas Mermaid de este
README son reconstrucciones hechas a partir de esos archivos. El `.mdj` se
pudo parsear como JSON; el `.eapx`, al ser una base Access binaria, se leyó
desde su export en PNG. Sirven para entender el diseño sin abrir StarUML ni
Enterprise Architect.

## Ejecución

Requisitos: **Node.js 20.19+** y **Docker Desktop** (o Docker Engine con
Compose v2) corriendo. No hace falta instalar Postgres.

```bash
cp .env.example .env    # credenciales locales por defecto
npm run db:up           # Postgres 16 en localhost:5432 (bases tpi_bolsin y tpi_bolsin_test)
npm install
npm run db:migrate
npm run db:seed
npm run dev             # backend :3000 + frontend :4200
```

`npm run dev:backend` y `npm run dev:frontend` levantan cada uno por separado.

Variables (`.env`, solo se versiona `.env.example`):

```
DATABASE_URL=postgres://tpi:tpi@localhost:5432/tpi_bolsin
TEST_DATABASE_URL=postgres://tpi:tpi@localhost:5432/tpi_bolsin_test
```

## Migraciones y semillas

| script | qué hace |
|---|---|
| `npm run db:up` / `db:down` | levanta / baja el contenedor `db` (`docker-compose.yml`) |
| `npm run db:migrate` | aplica las migraciones de TypeORM (`backend/src/database/migrations`) |
| `npm run db:revert` | deshace la última migración |
| `npm run db:seed` | carga el escenario de demo |
| `npm run db:reset` | baja el contenedor **borrando el volumen**, lo levanta, migra y siembra |

El esquema cambia **solo** con migraciones (`synchronize: false`). La segunda
migración pasa `bolsin.numero_precinto` y `remito.numero` a `integer`.

El seed carga la sesión `1`, una comisión médica de destino (Córdoba), tres de
origen y cinco bolsines con precinto 1 a 5 (en pantalla, `BOL-2026-001` a
`BOL-2026-005`). Cada bolsín tiene sus remitos y documentación en estado
`Enviado` / `EnBolsinEnviado`, listos para recibir. Es idempotente: correrlo
otra vez no duplica nada y deja los cinco bolsines de nuevo en `Enviado`.

Para mirar la base:

```bash
docker compose exec db psql -U tpi -d tpi_bolsin
```

## Navegación

- `/panel`: pantalla inicial, con el usuario logueado y su comisión médica.
- `/recepcion-bolsin`: registrar recepción de bolsín. **Cancelar** descarta la
  recepción en curso en el backend y vuelve al panel.

## Verificación

Con Postgres levantado (`npm run db:up`):

```bash
npm run lint
npm run build
npm test
npm run test:e2e
```

Es exactamente lo que corre el CI (`.github/workflows/ci.yml`), que usa un
service container `postgres:16`. Los tests usan siempre `TEST_DATABASE_URL`,
aplican las migraciones solos y vacían y vuelven a sembrar las tablas antes
de cada caso.

## Flujo de colaboración y gestión de ramas

Para mantener la coherencia del diseño, la estabilidad del código y el paso exitoso del CI, todos los colaboradores del equipo siguen estas pautas al trabajar con ramas:

### 1. Convención de ramas

| Prefijo | Propósito | Ejemplo |
|---|---|---|
| `feature/` | Nuevas funcionalidades o pantallas | `feature/filtro-bolsines`, `feature/opcion-rechazo` |
| `refactor/` | Reestructuraciones de código, arquitectura o persistencia | `refactor/typeorm-postgres`, `refactor/capas` |
| `fix/` o `bugfix/` | Corrección de fallos o discrepancias con el modelo | `fix/validacion-precinto`, `bugfix/fechafin-null` |
| `docs/` | Actualizaciones de documentación, README o diagramas | `docs/guia-estudio`, `docs/readme-fase6` |
| `chore/` | Tareas de tooling, dependencias, Docker o CI | `chore/update-eslint`, `chore/docker-compose-tuning` |

> La rama **`main`** contiene siempre la versión estable y funcional integrada. Se recomienda no hacer push directo a `main` y canalizar los cambios a través de Pull Requests.

### 2. Flujo de trabajo para colaboradores

1. **Sincronizar `main` local:**
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Crear la rama de trabajo:**
   ```bash
   git checkout -b feature/nombre-descriptivo
   ```
3. **Commits atómicos y descriptivos:**
   - Usar el estándar de Conventional Commits (`feat:`, `refactor:`, `docs:`, `test:`, `chore:`).
   - Mantener commits pequeños y autocontenidos.
4. **Verificación previa al push:**
   Antes de subir cambios al remoto, verificar que toda la suite pase localmente:
   ```bash
   npm run lint        # Valida que domain/ no importe TypeORM ni NestJS
   npm run build       # Compila backend y frontend
   npm test            # Tests unitarios y de integración contra Postgres
   npm run test:e2e    # Flujo end-to-end de endpoints HTTP
   ```
5. **Crear Pull Request (PR):**
   - Abrir el PR hacia `main`.
   - Incluir una descripción con la motivación del cambio y la relación con el caso de uso / diagramas.
   - Esperar la ejecución en verde del pipeline de CI (`.github/workflows/ci.yml`).
   - Solicitar revisión y aprobación de al menos un colaborador antes del merge.
6. **Integridad arquitectónica (Reglas no negociables):**
   - **`domain/` en TypeScript puro:** No agregar decoradores ni librerías externas en entidades de dominio.
   - **Nombres del modelo:** Respetar estrictamente los nombres de clases y métodos del diagrama de clases y de secuencia suministrados.
   - **Esquema de base de datos:** Cualquier cambio en tablas o columnas debe realizarse exclusivamente a través de migraciones de TypeORM (`npm run db:migrate`), nunca mediante `synchronize: true`.

