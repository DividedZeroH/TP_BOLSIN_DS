# Guía de estudio — TP_BOLSIN_DS

Documento de repaso del proyecto: arquitectura, capas, patrones y estado de cada
pieza. Pensado para preparar la defensa oral.

El proyecto implementa el **flujo normal del CU 28 "Registrar recepción de
bolsín"**: una comisión médica de destino recibe bolsines (con sus remitos y
documentación) enviados por comisiones de origen, y confirma la recepción.

---

## 1. Stack y estructura general

- **Lenguaje:** TypeScript.
- **Backend:** NestJS.
- **Persistencia:** Prisma ORM sobre SQLite.
- **Frontend:** Angular standalone.
- **Monorepo** con workspaces npm (`backend/`, `frontend/`).

```
backend/
  prisma/
    schema.prisma          # Modelos que mapean las tablas (las "entities" del ORM)
    migrations/            # Migraciones SQL
    seed.ts               # Datos de prueba (sesión 1, 5 bolsines)
  src/
    main.ts               # Bootstrap: prefijo /api, CORS, puerto
    app.module.ts         # Módulo raíz
    prisma/               # PrismaService + PrismaModule (global)
    dominio/              # Entidades del MODELO DE ANÁLISIS (no mapean tablas)
    recepcion-bolsin/     # El caso de uso, separado en capas (ver abajo)
frontend/
  src/app/
    panel-control/        # Pantalla inicial
    recepcion-bolsin/     # Pantalla del CU (componente + service + modelos)
```

---

## 2. Arquitectura en capas (lo central de la defensa)

Dentro de `backend/src/recepcion-bolsin/` el caso de uso está dividido en tres
capas + las entidades de dominio. Cada capa depende solo de la siguiente:

```
HTTP  →  Controller  →  Control (Gestor)  →  Servicio  →  Repositorio  →  Prisma/SQLite
                              │                  │
                              └─ Presenter       └─ Mapper (registros → dominio)
```

### `control/` — coordinación del CU y frontera
- **`recepcion-bolsin.controller.ts`** — Boundary HTTP. Traduce las peticiones
  web (`@Get`, `@Post`) en llamadas al Gestor. Es delgado: una llamada por
  endpoint.
- **`gestor-registrar-recepcion-bolsin.ts`** — La clase **Control** del análisis
  (`GestorRegistrarRecepcionBolsin`). **Coordina** los pasos del CU pero no tiene
  reglas de negocio ni acceso a datos: delega la lógica en el Servicio y el
  armado de la respuesta en el Presenter.
- **`recepcion-bolsin.presenter.ts`** — Output mapper: traduce las entidades de
  dominio a los objetos de pantalla (ViewModels).

### `servicio/` — lógica de negocio
- **`recepcion-bolsin.servicio.ts`** (`RecepcionBolsinServicio`) — Concentra
  **toda la lógica**: buscar usuario/comisión/bolsines, validar reglas,
  reconstruir el agregado con el Mapper, validar la opción y ejecutar la
  **confirmación transaccional** con los cambios de estado.
- **`bolsin.mapper.ts`** — Reconstruye las clases de dominio a partir de los
  registros planos que devuelve el repositorio.
- **`opcion-recepcion.handlers.ts`** / **`manejador-opcion-recepcion.ts`** —
  Tabla de opciones del flujo (ver patrón OCP abajo).

### `repositorio/` — persistencia
- **`*.repository.ts`** — **Interfaces** (`IBolsinRepository`, etc.) + tokens de
  inyección. El Servicio depende de estas interfaces, no de Prisma.
- **`prisma-*.repository.ts`** — Única implementación que conoce Prisma/SQLite.
- **`*.registro.ts`** — Tipos planos (DTOs internos) que representan las filas sin
  acoplarse a los tipos `Prisma.*`.

### `dominio/` — entidades del modelo de análisis
Clases con **comportamiento** (`Bolsin`, `Estado`, `Remito`, `Documentacion`,
`Empleado`, etc.). No mapean tablas: modelan el dominio del diagrama de clases
(métodos `sosEnviado()`, `recibir()`, `registrarCambioEstadoBolsin()`…).

---

## 3. Flujo del caso de uso (paso a paso)

Tres endpoints, todos pasando por Controller → Control → Servicio → Repositorio:

1. **`GET /api/recepciones-bolsines/iniciar?sesionId=1`**
   - Servicio: `iniciarRecepcion` → busca el empleado logueado (Sesion → Usuario
     → Empleado), su comisión y los bolsines **Enviados** a esa comisión.
   - Control: pasa esos objetos al Presenter → devuelve usuario, comisión y lista
     de bolsines.

2. **`GET /api/recepciones-bolsines/:bolsinId?sesionId=1`**
   - Servicio: `obtenerBolsinParaRecepcion` → trae el agregado completo, lo mapea
     a dominio y valida que sea de la comisión y esté `Enviado`.
   - Control: Presenter arma el detalle (remitos, documentación, opciones).

3. **`POST /api/recepciones-bolsines/:bolsinId/confirmar`**
   - Servicio: `confirmarRecepcion` → valida la opción (`tomarOpcion`) y ejecuta
     `tomarConfirmacion` **dentro de una transacción**:
     - Bolsín → `Recibido`, Remitos → `RecibidoYAceptado`, Documentación →
       `Aceptada`, registrando cada cambio de estado con su empleado y fecha.
   - Tras el commit, notifica al CU 29 (stub) y devuelve el resultado.

**Atomicidad:** si algo falla a mitad de la confirmación, la transacción de
Prisma revierte todo y el CU 29 no se dispara (cubierto por el test e2e).

---

## 4. Patrones de diseño usados (para nombrarlos en la defensa)

| Patrón / Principio | Dónde | Qué resuelve |
|---|---|---|
| **Repository** | `repositorio/` | Abstrae el acceso a datos detrás de una interfaz. |
| **DIP** (Inversión de dependencias) | Interfaces + `@Inject(TOKEN)` | El Servicio depende de abstracciones, no de Prisma. |
| **Inyección de dependencias / IoC** | `recepcion-bolsin.module.ts` | El contenedor de Nest conecta cada token con su clase. |
| **Data Mapper / Pure Fabrication** | `bolsin.mapper.ts`, `recepcion-bolsin.presenter.ts` | Mapeo entrada (datos→dominio) y salida (dominio→vista) fuera del Servicio. |
| **GRASP Controller** | `GestorRegistrarRecepcionBolsin` | Coordina el CU sin lógica de UI ni de datos. |
| **GRASP Expert** | `empleado.getComisionMedica()`, `bolsin.sosEnviado()` | Cada objeto responde sobre su propio estado. |
| **Adapter** | `recepcion-bolsin.controller.ts` | Adapta HTTP a llamadas al Gestor. |
| **OCP** (tabla de estrategias) | `opcion-recepcion.handlers.ts` | Agregar una opción = nueva entrada en el mapa, sin tocar `if/else`. |
| **Aggregate Root (DDD)** | `Bolsin` | Controla el acceso a Remito → DetalleRemito → Documentacion. |
| **Estado con historial** | `CambioEstadoBolsin` / `CambioEstadoDocumentacion` | Historial temporal con `fechaHoraInicio`/`fechaHoraFin`. |
| **Unit of Work / Transacción** | `ejecutarEnTransaccion` | Todo el confirmar ocurre en una sola transacción. |

**Por qué los repositorios tienen interfaz y el dominio no:** la interfaz sirve
para ocultar/reemplazar una tecnología (Prisma). Las entidades de dominio no
tienen implementación alternativa que ocultar, así que no necesitan abstraerse.

---

## 5. Checklist de piezas NestJS (estado real)

| Pieza | Estado | Detalle |
|---|---|---|
| **Controllers** | ✅ | `RecepcionBolsinController` (`@Controller`, `@Get`, `@Post`). |
| **Services (Providers)** | ✅ | `RecepcionBolsinServicio` + Gestor (Control). |
| **Repositories** | ✅ | Interfaces + impl Prisma (mejor que lo típico: con DIP). |
| **Modules** | ✅ | `AppModule`, `PrismaModule`, `RecepcionBolsinModule`. |
| **Entities / Schemas** | ✅ (matiz) | Las "entities" del ORM son **`schema.prisma`**, no clases `@Entity`. Las clases de `dominio/` son del modelo de análisis. |
| **DTOs** | ⚠️ Parcial | Existe `ConfirmarRecepcionBolsinDto`, pero sin decoradores de validación. |
| **Pipes** | ⚠️ Parcial | Solo el built-in `ParseIntPipe`. No hay `class-validator` ni `ValidationPipe` global. |
| **Exception Filters** | ⚠️ Sin clase propia | No hay `@Catch`/`ExceptionFilter`, pero se usan `NotFoundException`/`BadRequestException` que el **filtro por defecto** de Nest convierte en 404/400. |
| **Middlewares / Guards / Interceptors** | ❌ | No hay JWT, roles ni `@UseGuards`. La sesión es un `sesionId` numérico sin autenticación (fuera del alcance del CU). |

### Aclaración Entities vs Schema
- **Mapea tablas** → `prisma/schema.prisma` (`model Bolsin`, `model Estado`…).
- **Tipos planos de fila** → `repositorio/*.registro.ts`.
- **Entidades de dominio (comportamiento)** → `dominio/*.ts`.
- El puente entre tabla y dominio lo hace el **`BolsinMapper`**.

---

## 6. Mejoras conocidas / deuda técnica (para responder "¿qué falta?")

Ordenadas por impacto vs esfuerzo:

1. **Validación de entrada** — agregar `class-validator` a los DTOs +
   `ValidationPipe` global (`whitelist: true`). Hoy `sesionId` no se valida.
2. **Guard de estado en la confirmación** — `tomarConfirmacion` no revalida
   `sosEnviado()` antes de confirmar; un POST repetido podría re-procesar un
   bolsín ya recibido (falta de idempotencia / control de concurrencia).
3. **Autenticación real** — hoy `sesionId` viaja como número suelto (IDOR /
   Broken Access Control, OWASP A01). Falta un Guard (JWT o sesión validada).
4. **Exception Filter propio** — para un formato de error uniforme.
5. **Estados por string** (`Nombre.toUpperCase() === 'ENVIADO'`) — frágil; un
   enum daría chequeo en compilación.

---

## 7. Historial de cambios de arquitectura (lo que se hizo)

1. **Refactor inicial** — se extrajo la presentación del Gestor a un Presenter y
   se unificó la doble llamada del controlador en un solo método.
2. **Separación en capas** (rama `refactor/capas`) — se **dividió el Gestor** en
   dos clases: `GestorRegistrarRecepcionBolsin` (Control, solo coordina) y
   `RecepcionBolsinServicio` (toda la lógica). Se reorganizó el feature en
   carpetas `control/`, `servicio/`, `repositorio/`.
3. **Documentación** — se agregaron comentarios JSDoc en todas las entidades de
   dominio, el frontend y la infraestructura.

---

## 8. Cómo correrlo y verificarlo

```bash
# Desde la raíz
npm install
npm run db:migrate      # aplica migraciones Prisma
npm run db:seed         # carga sesión 1 y 5 bolsines de prueba
npm run dev             # backend (http://localhost:3000/api) + frontend (4200)
```

Verificación:
```bash
npm run build
npm run test:e2e --workspace backend   # recorre el flujo y prueba atomicidad
```

El test e2e (`backend/test/app.e2e-spec.ts`) recorre el flujo normal completo,
verifica la forma de las respuestas y que la transacción sea atómica ante un
fallo simulado (el `ERROR: Fallo simulado` del log es **intencional**).
