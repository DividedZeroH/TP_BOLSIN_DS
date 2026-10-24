# Plan.md — Handoff de implementación: TP_BOLSIN_DS (CU28)

> **Para el próximo agente:** este archivo es la fuente de verdad para continuar
> el trabajo. Leelo completo antes de tocar nada. Si hay conflicto entre
> `README.md` y `Plan.md`, gana `Plan.md` para arquitectura, y gana `README.md`
> para nombres de clases, métodos, estados y reglas de negocio.
>
> **Stack de persistencia vigente: TypeORM + PostgreSQL 16 en Docker
> (Compose).** Prisma y SQLite quedaron descartados: no los reintroduzcas.
>
> Última actualización: 2026-10-24. Rama de trabajo: `refactor/typeorm-postgres`.

---

## 1. Punto de partida (verificado)

La versión original de este plan suponía un repo vacío (solo `README.md`).
**No era así:** `C:\ProyectosVS\TP_BOLSINES` ya tenía una implementación
funcionando del CU28 con arquitectura **hexagonal + Prisma + SQLite**:
dominio puro, gestor cableado con tokens y `useFactory`, repositorio y unidad
de trabajo de Prisma, filter de errores propios, `arquitectura.spec.ts`, seed y
migraciones de Prisma, e2e con supertest, frontend Angular (`panel-control`,
`recepcion-bolsin`) y CI sobre SQLite.

Por eso el trabajo es una **refactorización en el lugar**: se reutiliza lo que
ya coincide (clases de dominio, catálogo de opciones, escenario del seed,
maquetado de la UI) y se elimina el aparato hexagonal y todo Prisma/SQLite.

Decisiones tomadas al retomar:

- Los nombres de estado del seed siguen al README (ver §5): el bolsín arranca
  en `Enviado`, no en `EnBolsinEnviado`.
- `numeroPrecinto` es `integer` 1..5; la UI lo muestra como `BOL-2026-00N`.
- Una fase = un commit en la rama `refactor/typeorm-postgres`.
- **TypeORM 0.3 + `@nestjs/typeorm` 11**, no 1.x/12: `@nestjs/typeorm` 12 se
  publica solo como ESM y ni Nest 11 (CommonJS) ni Jest lo cargan.
- El gestor inyecta `Repository<BolsinOrmEntity>` y `DataSource`; sesión y
  estados los pide a `SesionService` (identidad) y `EstadoService` (catálogo),
  que son los dueños de esas tablas. Dentro de la transacción se les pasa el
  `EntityManager`.
- `buscarEstadosRecibidoYAceptado()` (plural, como en el diagrama de
  secuencia) devuelve el estado del remito y el de la documentación. El
  diagrama de clases del README lo escribe en singular.

---

## 2. La remodelación en una frase

De **monolito modular hexagonal con puertos, adaptadores, tokens de inyección y
test de arquitectura** a **NestJS clásico por módulos de dominio**, con
**TypeORM** (repositorios inyectados con `@InjectRepository` y `DataSource`
para transacciones) hablando contra **PostgreSQL 16 levantado con Docker
Compose**, y entidades de dominio en TypeScript puro.

**Qué se conserva (no negociable, es lo que evalúa la cátedra):**

- Nombres exactos de clases y métodos del diagrama de clases.
- `GestorRegistrarRecepcionBolsin` con un método por mensaje del diagrama de
  secuencia, ejecutados en ese orden.
- Estado modelado como **lista de cambios con `fechaHoraInicio`/`fechaHoraFin`**;
  el estado actual es el cambio con `fechaHoraFin === null` (`sosActual()`).
  Nunca un campo `estado` mutable suelto.
- `Estado` como catálogo único (`nombre` + `ambito`) con predicados de dominio
  (`sosEnviado()`, `sosRecibido()`, `sosRecibidoYAceptado()`, `sosAceptada()`,
  `sosAmbitoBolsin()`, `sosAmbitoRemito()`, `sosAmbitoDocumentacion()`).
- Solo la opción `CONTENIDO_IGUAL` implementada. Las otras 3 se publican desde
  el backend con `implementado: false` y se rechazan con 400.
- `<<include>>` CU29 como `NotificadorCU29Service` (log solamente).

**Qué se elimina (si volvés a verlo, es un error):**

`application/ports/in`, `application/ports/out`, `IBolsinRepository`,
`IUnidadDeTrabajo`, `PrismaBolsinRepository`, `PrismaUnidadDeTrabajo`, tokens
(`BOLSIN_REPOSITORY`, `UNIDAD_DE_TRABAJO`, `ESTADO_REPOSITORY`,
`SESION_REPOSITORY`, `REGISTRAR_RECEPCION_BOLSIN`, `NOTIFICADOR_RECEPCION`),
`useFactory` en los módulos, `arquitectura.spec.ts`, `index.ts` de API pública
por módulo, carpeta `platform/`, errores de dominio propios
(`EntidadNoEncontradaError`, `OperacionInvalidaError`) y el
`ErroresRecepcionBolsinFilter`.

Además, **todo lo de Prisma/SQLite**: `PrismaService`, `PrismaModule`,
`prisma/schema.prisma`, `prisma/migrations`, `prisma/dev.db`, el paquete
`prisma`/`@prisma/client`, `$transaction` y cualquier `synchronize: true`.

| Antes | Ahora |
|---|---|
| `application/ports/in` + `ports/out` | el controller llama al service |
| `IBolsinRepository` / `PrismaBolsinRepository` | `Repository<BolsinOrmEntity>` de TypeORM (`@InjectRepository`) en el service |
| `IUnidadDeTrabajo` / `PrismaUnidadDeTrabajo` | `this.dataSource.transaction(...)` directo |
| Tokens de inyección | `@InjectRepository(...)` y clases concretas |
| `*Registro` + mapper en infraestructura | `bolsin.mapper.ts` a nivel del módulo (ORM ↔ dominio) |
| Prisma + SQLite | TypeORM + PostgreSQL 16 en Docker (`docker-compose.yml`) |
| Errores propios + filter | `NotFoundException` / `BadRequestException` en el service |
| `arquitectura.spec.ts` + reglas de capa amplias | ESLint normal + 1 regla para `domain/` |
| `index.ts` de API pública | imports normales entre módulos |

### Decisiones ya tomadas (no reabrir sin preguntar)

1. **Persistencia:** `DatabaseModule` con `TypeOrmModule.forRootAsync` es
   **`@Global()`**; `synchronize: false` siempre, el esquema se cambia **solo**
   con migraciones de TypeORM. `autoLoadEntities: true`.
2. **PostgreSQL en Docker, sin SQLite.** `docker-compose.yml` en la raíz con
   `postgres:16-alpine`, healthcheck y un volumen nombrado. Un único contenedor
   crea dos bases vía script de init: `tpi_bolsin` (dev) y `tpi_bolsin_test`
   (tests e2e/integración).
3. **Entidades ORM separadas del dominio.** `domain/` sigue siendo TypeScript
   puro. Cada módulo tiene `persistence/*.orm-entity.ts` con los decoradores de
   TypeORM y el `*.mapper.ts` convierte ORM ↔ dominio.
4. Se mantiene **una** regla ESLint: `domain/` no puede importar `typeorm` ni
   `@nestjs/*`.
5. Errores con las excepciones built-in de Nest, lanzadas desde el gestor. Sin
   clases propias ni filter.
6. La recepción en curso vive **en memoria**, en un store técnico keyed por
   `recepcionId`, porque el diagrama de secuencia exige
   `nuevaRecepcionBolsin()` → `tomarBolsin()` → `tomarOpcion()` →
   `tomarConfirmacion()` como pasos con estado.

---

## 3. Estructura objetivo

```
TP_BOLSINES/
├── package.json                 # npm workspaces: backend, frontend + scripts raíz
├── docker-compose.yml           # postgres:16-alpine (dev + test)
├── docker/initdb/01-test-db.sql # crea tpi_bolsin_test en el mismo contenedor
├── .env.example                 # DATABASE_URL / TEST_DATABASE_URL
├── .env                         # local, va en .gitignore
├── eslint.config.mjs            # regla: domain/ no importa typeorm ni @nestjs
├── .prettierrc
├── .github/workflows/ci.yml     # service container postgres:16
├── README.md
├── Plan.md                      # este archivo
├── backend/
│   ├── test/                    # e2e (supertest), usa tpi_bolsin_test
│   └── src/
│       ├── main.ts              # prefijo global /api, ValidationPipe
│       ├── app.module.ts
│       ├── database/
│       │   ├── database.module.ts # @Global(), TypeOrmModule.forRootAsync
│       │   ├── data-source.ts     # DataSource para la CLI y el seed
│       │   ├── migrations/
│       │   └── seeds/seed.ts      # idempotente (upsert)
│       └── modules/
│           ├── identidad/       # sesion.controller/service, persistence/, domain/
│           ├── catalogo/        # estado.service, persistence/, domain/
│           ├── organizacion/    # persistence/comision-medica, domain/comision-medica
│           └── recepcion-bolsin/
│               ├── recepcion-bolsin.module.ts
│               ├── recepcion-bolsin.controller.ts
│               ├── gestor-registrar-recepcion-bolsin.service.ts
│               ├── recepcion-en-curso.store.ts
│               ├── notificador-cu29.service.ts
│               ├── opciones-recepcion.ts
│               ├── bolsin.mapper.ts
│               ├── persistence/   # *.orm-entity.ts
│               ├── domain/        # bolsin, remito, detalle-remito, documentacion, ...
│               └── dto/
└── frontend/src/app/
    ├── panel/panel.component.ts
    └── recepcion-bolsin/
        ├── recepcion-bolsin.component.ts
        └── recepcion-bolsin.service.ts
```

**`domain/` es TypeScript puro:** clases, sin `@Injectable()`, sin decoradores
de TypeORM, sin imports de TypeORM ni de Nest.

**Las entidades ORM viven en `persistence/`, no en `src/database/`.**

---

## 4. Cómo retomar el trabajo (quickstart)

Requisitos: Node.js 20+ y Docker Desktop (o Docker Engine + Compose v2) con el
demonio corriendo.

```bash
cp .env.example .env
npm run db:up                 # Postgres 16 en localhost:5432 (dev + test)
npm install
npm run db:migrate
npm run db:seed
npm run dev                   # backend en :3000, frontend en :4200
```

| script | qué hace |
|---|---|
| `dev` | backend + frontend en paralelo |
| `db:up` / `db:down` | `docker compose up -d --wait db` / `docker compose down` |
| `db:migrate` | `typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts` |
| `db:revert` | `migration:revert` con el mismo data source |
| `db:seed` | ejecuta `src/database/seeds/seed.ts` |
| `db:reset` | `down -v` + `db:up` + `db:migrate` + `db:seed` (solo local) |

Verificación (es lo que corre el CI): `npm run lint`, `npm run build`,
`npm test`, `npm run test:e2e`. Los tests usan `TEST_DATABASE_URL`.

---

## 5. Modelo de dominio (implementación)

### Catálogo `Estado`

Estados que el seed **debe** crear (y solo estos). Los nombres siguen al README
(«bolsines … en estado `Enviado`/`EnBolsinEnviado`»):

| ámbito | nombre |
|---|---|
| `BOLSIN` | `Enviado`, `Recibido` |
| `REMITO` | `Enviado`, `RecibidoYAceptado` |
| `DOCUMENTACION` | `EnBolsinEnviado`, `Aceptada` |

`Redirigida`, `Rechazada` y `NoRecibida` **no existen** en el seed ni en el
código: son las 3 ramas no implementadas.

### Cambios de estado

- `CambioEstadoBolsin`: `fechaHoraInicio`, `fechaHoraFin`, `estado`,
  `responsable`. Métodos: `sosActual()`, `sosEnviado()`, `setFechaHoraFin()`.
- `CambioEstadoDocumentacion`: ídem sin `sosEnviado()`.
- `sosActual()` devuelve `fechaHoraFin === null`.

### `Bolsin`, `Documentacion`

Ver README. `Documentacion.recibir()` es la **única** transición que usa el
CU28: `EnBolsinEnviado` → `Aceptada`.

---

## 6. Modelo de datos

- `docker-compose.yml`, `docker/initdb/01-test-db.sql`, `.env.example` en la raíz.
- `src/database/data-source.ts` (CLI + seed) y `DatabaseModule` (app).
- Columnas en `snake_case` con `name:` explícito.
- `Bolsin.numeroPrecinto` y `Remito.numero` son `integer`, vía una migración
  explícita posterior a la inicial.
- `Documentacion` no tiene columna de estado. `Remito` sí (`estado_id`).
- `RecepcionEnCurso` **no** es una entidad TypeORM.
- Seed idempotente: sesión `1` → usuario → empleado → CM destino; 1 CM destino
  + 3 de origen; bolsines con precinto 1..5 (mostrados como `BOL-2026-00N`).

---

## 7. Contrato REST

| Paso de la secuencia | Endpoint | Body | Devuelve |
|---|---|---|---|
| `nuevaRecepcionBolsin()` … `mostrarDatosBolsinesParaSeleccion` | `POST /api/recepciones-bolsines` | `{ sesionId }` | `{ recepcionId, usuarioLogueado, comisionMedica, bolsines[] }` |
| rehidratar pantalla | `GET /api/recepciones-bolsines/:recepcionId` | — | estado actual de la recepción |
| `tomarBolsin()` … `mostrarOpcionesRecepcionParaSeleccion` | `POST /api/recepciones-bolsines/:recepcionId/bolsin` | `{ numeroPrecinto }` | `{ bolsin, documentacion[], opciones[] }` |
| `tomarOpcion()` + `pedirConfirmacion()` | `POST /api/recepciones-bolsines/:recepcionId/opcion` | `{ codigo }` | `{ confirma: true, mensaje }` |
| `tomarConfirmacion()` … `finDelCU()` | `POST /api/recepciones-bolsines/:recepcionId/confirmacion` | `{}` | `{ mensaje, ... }` y borra la recepción |
| cancelar recepción | `DELETE /api/recepciones-bolsines/:recepcionId` | — | `204` |

Extra: `GET /api/sesiones/:id/comision-medica`.

Errores: paso fuera de orden → `400`; `recepcionId` inexistente o vencido →
`404`; precinto que no pertenece a la CM del usuario → `404`; opción no
implementada → `400`.

`RecepcionEnCurso` vive en un `Map` dentro de `RecepcionEnCursoStore`
(singleton), TTL 30 minutos. Se pierde al reiniciar el backend.

---

## 8. Fases y progreso

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Andamiaje del monorepo, Docker/Postgres, ESLint, Prettier, CI | HECHA (healthcheck de Docker pendiente de verificar en una máquina con Docker) |
| 1 | Dominio en TypeScript puro | HECHA |
| 2 | TypeORM: entidades ORM, migraciones, seed | HECHA |
| 3 | Gestor + store en memoria + mapper | HECHA |
| 4 | HTTP: controllers, DTOs, validación de orden | HECHA |
| 5 | Frontend Angular | HECHA |
| 6 | E2E, CI verde, reescritura del README | HECHA (falta ver el CI en GitHub tras el primer push) |

Criterios de cierre:

- **0:** `docker compose up -d db` healthy; `npm run lint` falla si `domain/`
  importa TypeORM.
- **1:** tests de dominio verdes, `domain/` sin framework ni ORM.
- **2:** `db:migrate && db:seed` dos veces deja la misma DB; `db:revert`
  deshace la última migración.
- **3:** al confirmar, bolsín `Recibido`, remito `RecibidoYAceptado`,
  documentación `Aceptada` (tests de integración contra `tpi_bolsin_test`).
- **4:** e2e del flujo completo + 4 casos de error sobre Postgres.
- **5:** recorrido manual completo contra el seed.
- **6:** `lint`, `build`, `test`, `test:e2e` en verde; README reescrito.

---

## 9. Reglas para el próximo agente

1. **No reintroduzcas hexagonal** (`IBolsinRepository`, tokens, `useFactory`).
2. **No reintroduzcas Prisma ni SQLite.**
3. **No renombres** las clases ni los métodos del diagrama.
4. **No implementes** las 3 opciones restantes, los flujos A1–A6, CU29 real
   ni autenticación.
5. **No metas TypeORM dentro de `domain/`.**
6. **No dejes el estado actual de bolsín/documentación en una columna
   mutable.** Siempre el cambio con `fechaHoraFin === null`.
7. No marques una fase `HECHA` sin su criterio de cierre.
8. Si algo del README contradice este plan, **preguntá** antes de decidir.
