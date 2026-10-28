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

Las clases PantallaRegistrarRecepcionBolsin y GestorRegistrarRecepcionBolsin
conservan los mensajes del CU28. Las entidades de `entity/` contienen datos,
relaciones y decoradores de TypeORM; sus métodos del modelo de análisis se
ejecutan en los servicios correspondientes, manteniendo nombres y comportamiento.
Los identificadores, DTOs, controlador HTTP y adaptador de API son los elementos
técnicos de la implementación web.

## Modelo de dominio

El agregado central es **Bolsin**, relacionado con Remito → DetalleRemito →
Documentacion. BolsinesService, RemitosService y DocumentacionesService ejecutan
esa colaboración. Bolsin y Documentacion conservan sus listas de cambios de
estado con fecha de inicio/fin; el estado actual es el cambio cuya
`fechaHoraFin` es `null`, evaluado por `sosActual()` en el servicio.
Estado es un catálogo único de nombre y ámbito, cargado por seed y consultado
a través de EstadoService. Sus predicados `sosEnviado()`, `sosRecibido()`
y `sosAmbitoBolsin()` también viven en el servicio.

Empleado, ComisionMedica, Sesion y Usuario están en sus módulos propios porque
son compartidos por los casos de uso. Los diagramas siguientes representan
**el modelo de análisis del TP**; la distribución actual de los métodos en
servicios se detalla en la sección Arquitectura del backend.

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
> diagrama de arriba usa la vista curada (PNG). Sus métodos se implementan
> actualmente en los servicios propietarios, como se detalla más abajo.

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

NestJS organizado por entidad principal, con lógica de negocio en los servicios.
Cada entidad tiene una sola representación: la clase con decoradores de TypeORM.

```text
backend/src/
├── database/
│   ├── database.module.ts
│   ├── configuracion.ts
│   ├── transaction/             # implementación de la transacción compartida
│   ├── migrations/              # esquema conservado
│   └── seeds/seed.ts            # catálogo de estados y escenario de demo
├── shared/transaction/
│   └── unidad-de-trabajo.interface.ts
└── modules/
    ├── bolsines/                # Bolsin y CambioEstadoBolsin
    ├── remitos/                 # Remito y DetalleRemito
    ├── documentaciones/         # Documentacion, CambioEstadoDocumentacion, TipoDocumentacion
    ├── usuarios/                # Usuario
    ├── empleados/               # Empleado
    ├── sesiones/                # Sesion y endpoint del panel
    ├── comisiones-medicas/      # ComisionMedica
    ├── estados/                # Estado y predicados del catálogo
    └── recepcion-bolsin/        # GestorRegistrarRecepcionBolsin, coordinador CU28
```

Cada módulo usa únicamente las carpetas que necesita de esta estructura:

```text
modulo/
├── controller/                 # endpoints y DTOs de entrada
├── service/                    # lógica, métodos del modelo y respuestas del CU
├── entity/                     # atributos, relaciones y decoradores de TypeORM
├── repository/
│   ├── modulo.repository.interface.ts
│   └── modulo.repository.ts
└── modulo.module.ts
```

Solo sesiones y recepcion-bolsin tienen controllers porque son los módulos que
atienden rutas existentes del frontend. No se crean endpoints CRUD ni carpetas
vacías. Recepcion-bolsin no tiene una entidad de BD: su recepción en curso
continúa en memoria, con interfaz e implementación en `repository/`.
El catálogo de opciones permanece en `opciones-recepcion.ts`, junto al módulo.

| Carpeta | Responsabilidad |
|---|---|
| `controller/` | Recibir solicitudes HTTP, validar el formato con DTOs y llamar al servicio del propio módulo. |
| `service/` | Ejecutar toda la lógica de negocio, incluidos `sosEnviado()`, `sosActual()`, `recibir()`, getters y cambios de estado. |
| `entity/` | Definir datos, tablas, columnas y relaciones. Sin métodos, constructores ni lógica de negocio. |
| `repository/` | Declarar un contrato propio e implementar consultas, escrituras, carga de relaciones y bloqueos. |

Ya no hay `domain/`, `persistence/` ni `mapper/`: el repositorio devuelve
directamente las entidades cargadas por TypeORM. Los servicios usan sus campos
sin importar conexiones o utilidades del ORM.

Los contratos se inyectan con tokens explícitos, por ejemplo
`@Inject(BOLSINES_REPOSITORY)` y
`{ provide: BOLSINES_REPOSITORY, useClass: BolsinesRepository }`.
Cada implementación declara `implements`; cada módulo exporta sus servicios,
manteniendo privados sus repositorios.

### Métodos del modelo en servicios

Los nombres y comportamientos se conservan. Al ser métodos del servicio,
reciben como primer argumento la entidad sobre la que operan:

```ts
bolsinesService.sosEnviado(bolsin);
bolsinesService.registrarCambioEstadoBolsin(bolsin, estado, empleado, fechaHora);
documentacionesService.recibir(documentacion, estado, empleado, fechaHora);
```

| Clases de los diagramas de análisis | Servicio que ejecuta sus métodos |
|---|---|
| Bolsin | BolsinesService |
| CambioEstadoBolsin | CambioEstadoBolsinService |
| Remito | RemitosService |
| DetalleRemito | DetalleRemitoService |
| Documentacion | DocumentacionesService |
| CambioEstadoDocumentacion | CambioEstadoDocumentacionService |
| TipoDocumentacion | TipoDocumentacionService |
| Estado | EstadoService |
| Sesion | SesionService |
| Usuario | UsuariosService |
| Empleado | EmpleadosService |
| ComisionMedica | ComisionesMedicasService |

La actualización conserva el recorrido Bolsin → Remito → DetalleRemito →
Documentacion, ejecutado por BolsinesService → RemitosService →
DetalleRemitoService → DocumentacionesService. El gestor conserva los mensajes del CU28 y coordina
estos servicios. El estado actual sigue siendo el cambio cuya
`fechaHoraFin === null`.

La sesión se resuelve con SesionService → UsuariosService → EmpleadosService →
ComisionesMedicasService. Cada servicio obtiene los datos de su propio
repositorio y resuelve las referencias mediante el servicio propietario.

### Estados cargados por seed

`npm run db:seed` carga el catálogo persistido mediante
`sembrarEstados()`, que hace upsert por nombre y ámbito:

| Ámbito | Estados |
|---|---|
| BOLSIN | Enviado, Recibido |
| REMITO | Enviado, RecibidoYAceptado |
| DOCUMENTACION | EnBolsinEnviado, RecibidoYAceptado |

El seed se puede repetir sin duplicar estados ni cambiar sus identificadores.
Los servicios consultan esos registros en PostgreSQL; no construyen instancias
de Estado con IDs fijos ni inventan estados faltantes. Los nombres usados para
consultar o evaluar un registro son los del catálogo. Si falta un estado
requerido, se conserva el error HTTP correspondiente.

La migración `EstadoDocumentacionSecuencia1793145600000` cambia el nombre
anterior `Aceptada` a `RecibidoYAceptado`, conservando el ID histórico y las
referencias de los cambios de estado. Si el seed nuevo ya creó el otro nombre,
la migración reúne ambos registros. Se aplica con `npm run db:migrate`, sin
reiniciar la base ni volver a generar los bolsines existentes.

### Ejemplo: confirmar la recepción del precinto 1

1. El controller recibe
   `POST /api/recepciones-bolsines/:recepcionId/confirmacion` y llama a
   `GestorRegistrarRecepcionBolsin.tomarConfirmacion()`.
2. El gestor valida los pasos de selección, obtiene el empleado por
   SesionService e inicia una unidad de trabajo con `UNIDAD_DE_TRABAJO`.
3. La infraestructura abre **una transacción READ COMMITTED** y entrega un
   contexto opaco, sin conexiones ni repositorios en su contrato.
4. BolsinesService solicita a su repositorio el bloqueo
   `SELECT ... FOR UPDATE` y la relectura posterior. El gestor revalida comisión
   y estado Enviado mediante los servicios.
5. EstadoService consulta los estados del catálogo dentro del mismo contexto.
   BolsinesService aplica `registrarCambioEstadoBolsin()` y coordina
   `actualizarEstadoRemito()` y `actualizarDocumentacion()`. Las reglas cierran
   cambios y generan los nuevos con fecha y responsable.
6. BolsinesService, RemitosService y DocumentacionesService persisten las
   modificaciones con sus respectivos repositorios y **el mismo contexto**.
   Solo la infraestructura lo resuelve al EntityManager compartido.
7. Cualquier fallo revierte las tres escrituras y conserva la recepción para
   reintentar. Las escrituras y el bloqueo exigen un contexto activo.
8. Después del commit se invoca CU29 y se conserva el resultado con el paso
   `CONFIRMADA`. Angular ejecuta `informarEjecucionExitosa()` y muestra el aviso.
9. Al aceptar el aviso, la pantalla solicita `finDelCU()`: el backend elimina
   la recepción en memoria y Angular vuelve al panel, destruyendo la pantalla.

Dos confirmaciones simultáneas se serializan por el bloqueo del bolsín. La
segunda relee el estado confirmado y devuelve 400, sin duplicar recepciones ni
notificaciones.

Un reintento de la misma recepción ya confirmada devuelve su resultado guardado,
sin volver a persistir ni invocar CU29.

`RecepcionesEnCursoRepositoryInterface`, inyectado mediante `RECEPCIONES_EN_CURSO_REPOSITORY`, conserva
su implementación en memoria (`RecepcionesEnCursoRepository`), el Map, el TTL de
30 minutos y el barrido. La respuesta inicial devuelve usuario y comisión;
el listado se solicita después de mostrar la comisión. El cierre tiene una
petición propia para ocurrir después de informar el éxito.

### API

| Mensaje de la secuencia | Endpoint | Body |
|---|---|---|
| `nuevaRecepcionBolsin()` | `POST /api/recepciones-bolsines` | `{ sesionId }` |
| búsqueda después de mostrar la comisión | `GET /api/recepciones-bolsines/:recepcionId/bolsines` | — |
| (rehidratar pantalla) | `GET /api/recepciones-bolsines/:recepcionId` | — |
| `tomarBolsin()` | `POST /api/recepciones-bolsines/:recepcionId/bolsin` | `{ numeroPrecinto }` |
| `tomarOpcion()` → `pedirConfirmacion()` | `POST /api/recepciones-bolsines/:recepcionId/opcion` | `{ codigo }` |
| `tomarConfirmacion()` | `POST /api/recepciones-bolsines/:recepcionId/confirmacion` | `{}` |
| `finDelCU()` después de informar el éxito | `POST /api/recepciones-bolsines/:recepcionId/fin` | `{}` (204) |
| cancelar | `DELETE /api/recepciones-bolsines/:recepcionId` | — (204) |
| panel | `GET /api/sesiones/:id/comision-medica` | — |

## Cómo se hace cumplir la arquitectura

- ESLint aplica `arquitectura/capas` (`tools/architecture.cjs`): exige entidades
  sin métodos, bloquea utilidades de TypeORM y conexiones en servicios y
  controllers, y rechaza repositorios ajenos o concretos desde servicios.
- También impide repositorios que consuman servicios, exportaciones de
  repositorios desde módulos y construcción manual de Estado en producción.
  Cubre imports de tipos, imports dinámicos y reexportaciones.
## Trazabilidad: diagrama de secuencia y código

Comparación con la página 3 de PPAI2026_G6_E1_Analisis.pdf (Entrega 1,
diagrama de secuencia del CU28):

| Paso del diagrama | Implementación actual |
|---|---|
| registrarRecepcionBolsin / abrirVentana / nuevaRecepcionBolsin | PantallaRegistrarRecepcionBolsin inicia en ngOnInit → registrarRecepcionBolsin → abrirVentana → POST → GestorRegistrarRecepcionBolsin.nuevaRecepcionBolsin. |
| buscarUsuarioLogueado / buscarComisionMedicaUsuario | El gestor recorre SesionService → UsuariosService → EmpleadosService → ComisionesMedicasService. |
| mostrarComisionMedicaUsuario | Angular muestra y renderiza la comisión antes de solicitar el listado de bolsines. |
| buscarBolsinEnviadoCMUsuario / validarComisionMedicaBolsin / buscarPrecintoBolsin / buscarComisionMedicaBolsin | Se evalúan los cambios actuales con sosEnviado, la comisión destino, los precintos y las comisiones origen. |
| mostrarDatosBolsinesParaSeleccion | Angular presenta los precintos y comisiones de origen recibidos del listado. |
| tomarBolsin / buscarRemitoBolsin / getNumero | El gestor obtiene los remitos y sus números antes de buscar documentación. |
| buscarDocumentacionBolsin / buscarDocumentacion / mostrarTipoDocumentacion / getNombre / getAsunto | Se recorre cada remito y detalle. Para cada documento se consulta su tipo, el nombre del tipo y después el asunto. |
| mostrarDocumentacionBolsin / mostrarOpcionesRecepcionParaSeleccion | La pantalla ejecuta estos dos métodos en ese orden y agrupa la documentación por remito. |
| tomarOpcion / pedirConfirmacion | El gestor valida la opción y devuelve el mensaje de confirmación que muestra Angular. |
| tomarConfirmacion / buscarEstadoRecibidoBolsin / getFechaHoraActual / registrarCambioEstadoBolsin | Dentro de una sola transacción se bloquea y revalida el bolsín, se busca Recibido y recién entonces se toma la fecha, se cierra el cambio anterior y se crea el nuevo. |
| buscarEstadosRecibidoYAceptado / actualizarEstadoRemito / actualizarDocumentacion | Se consultan los estados en la BD y se conserva la cascada de bolsín, remitos, detalles y documentación, ejecutada por servicios. |
| llamarCU29 / informarEjecucionExitosa / finDelCU | Después del commit se invoca al notificador y la pantalla informa el éxito. Al aceptar el aviso, se solicita finDelCU, se libera la recepción en memoria y se vuelve al panel, destruyendo la pantalla. |

Los mensajes tienen métodos identificables y conservan el orden del diagrama.
Por la arquitectura solicitada, cada participante del modelo ejecuta sus
métodos en el servicio correspondiente; entity contiene solo datos y
decoradores. Se conservan las consultas, el bloqueo, la revalidación y la
transacción necesarios para persistir con seguridad. El transporte HTTP separa
el inicio, la búsqueda y el cierre para respetar los momentos en que la
pantalla presenta la comisión y el resultado.

Hay una inconsistencia en el PDF: el diagrama de secuencia rotula el nuevo
cambio de documentación como RecibidoYAceptado, mientras la máquina de estados
de la página 5 define el destino como Aceptada. Para seguir el diagrama de
secuencia, DOCUMENTACION y REMITO usan RecibidoYAceptado. La máquina de estados
reproducida arriba conserva las etiquetas del documento original. El seed y
la migración reflejan el nombre elegido para la implementación.

CU29 conserva una invocación después del commit, implementada como registro en
el log. No se implementa el caso de uso de notificación completo ni los flujos
alternativos. La opción implementada sigue siendo CONTENIDO_IGUAL.

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
- **Hace falta PostgreSQL** (Docker en el entorno local) para ejecutar el sistema.
  No hay modo SQLite ni base embebida.
- El listado inicial reconstruye el agregado completo de cada bolsín para que
  BolsinesService evalúe `sosEnviado()`. Con el volumen del TP es irrelevante.

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
npm run db:up           # Postgres 16 en localhost:5432 (base tpi_bolsin)
npm install
npm run db:migrate
npm run db:seed
npm run dev             # backend :3000 + frontend :4200
```

`npm run dev:backend` y `npm run dev:frontend` levantan cada uno por separado.

Variables (`.env`, solo se versiona `.env.example`):

```
DATABASE_URL=postgres://tpi:tpi@localhost:5432/tpi_bolsin
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

```bash
npm run lint
npm run build
```

El CI ejecuta estos dos controles sin requerir una base de datos.
Por solicitud del usuario se retiraron todas las suites automáticas de pruebas,
fixtures, configuraciones y comandos asociados. Los controles de arquitectura
continúan formando parte de ESLint.

Para comprobar el recorrido con la aplicación iniciada:

1. Abrir /panel y entrar a Registrar recepción de bolsín.
2. Seleccionar un bolsín y revisar sus remitos y documentación.
3. Elegir CONTENIDO_IGUAL y confirmar.
4. Comprobar el mensaje exitoso y que el bolsín ya no figure entre los enviados.

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
   npm run lint        # Verifica capas, repositorios propios y entidades sin lógica
   npm run build       # Compila backend y frontend
   ```
5. **Crear Pull Request (PR):**
   - Abrir el PR hacia `main`.
   - Incluir una descripción con la motivación del cambio y la relación con el caso de uso / diagramas.
   - Esperar la ejecución en verde del pipeline de CI (`.github/workflows/ci.yml`).
   - Solicitar revisión y aprobación de al menos un colaborador antes del merge.
6. **Integridad arquitectónica (Reglas no negociables):**
   - **Entidades sin lógica:** Los decoradores y datos van en `entity/`; los métodos y reglas de negocio van en `service/`.
   - **Nombres del modelo:** Respetar estrictamente los nombres de clases y métodos del diagrama de clases y de secuencia suministrados.
   - **Esquema de base de datos:** Cualquier cambio en tablas o columnas debe realizarse exclusivamente a través de migraciones de TypeORM (`npm run db:migrate`), nunca mediante `synchronize: true`.

