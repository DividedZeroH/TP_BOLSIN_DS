# Arquitectura del Proyecto PPAI - Recepción de Bolsines

## 📐 Visión General de la Arquitectura

El proyecto sigue una arquitectura **Cliente-Servidor** con separación clara entre capas, implementando patrones de **Domain-Driven Design** (DDD) y **MVC**.

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR DEL USUARIO                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           FRONTEND - Angular 19 (SPA)                │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ Componente: PantallaRegistrarRecepcionBolsin   │  │   │
│  │  │  - Boundary del análisis PPAI                  │  │   │
│  │  │  - Captura: búsqueda, selección, validación   │  │   │
│  │  │  - Estados: cargando, error, confirmación     │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ Servicio: RecepcionBolsinApiService            │  │   │
│  │  │  - HTTP calls a backend                        │  │   │
│  │  │  - Manejo de requests/responses                │  │   │
│  │  │  - RxJS observables                            │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ Modelos: recepcion-bolsin.modelos.ts           │  │   │
│  │  │  - OpcionRecepcionVista                        │  │   │
│  │  │  - ResultadoRecepcion                          │  │   │
│  │  │  - BolsinVista, RemitoVista, etc               │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│                    HTTP/REST API                             │
│                      (puerto 3000)                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────────────┐
        │     BACKEND - NestJS 11                      │
        │                                              │
        │  ┌──────────────────────────────────────┐   │
        │  │ Controllers (HTTP Endpoints)          │   │
        │  │ - RecepcionBolsinController           │   │
        │  │   GET /bolsines                       │   │
        │  │   GET /bolsines/:id/detalle           │   │
        │  │   POST /bolsines/:id/registrar        │   │
        │  └──────────────────────────────────────┘   │
        │           ↓                                  │
        │  ┌──────────────────────────────────────┐   │
        │  │ Servicios (Lógica de Negocio)        │   │
        │  │ - GestorRegistrarRecepcionBolsin     │   │
        │  │ - Validaciones                       │   │
        │  │ - Cambios de estado                  │   │
        │  └──────────────────────────────────────┘   │
        │           ↓                                  │
        │  ┌──────────────────────────────────────┐   │
        │  │ Dominio (Clases del Análisis)        │   │
        │  │ - Bolsin                             │   │
        │  │ - Remito                             │   │
        │  │ - Estado (predicados sos...)         │   │
        │  │ - Documentacion                      │   │
        │  │ - ComisionMedica                     │   │
        │  └──────────────────────────────────────┘   │
        │           ↓                                  │
        │  ┌──────────────────────────────────────┐   │
        │  │ Prisma (ORM)                         │   │
        │  │ - Generación de tipos TypeScript     │   │
        │  │ - Migrations                         │   │
        │  │ - Query builder                      │   │
        │  └──────────────────────────────────────┘   │
        └──────────────────────────────────────────────┘
                     ↓
        ┌──────────────────────────────────────────────┐
        │   BASE DE DATOS - SQLite (Desarrollo)        │
        │                                              │
        │  Tablas principales:                         │
        │  - ComisionMedica                            │
        │  - Bolsin                                    │
        │  - Remito                                    │
        │  - Documentacion                             │
        │  - Estado                                    │
        │  - CambioEstadoBolsin                        │
        │  - CambioEstadoDocumentacion                 │
        │  - Usuario, Sesion, Empleado                 │
        └──────────────────────────────────────────────┘
```

---

## 🎯 Patrones de Diseño

### 1. **MVC (Model-View-Controller)**

#### View
- **Angular Components**: `PantallaRegistrarRecepcionBolsin`
- Templates HTML y estilos CSS
- Binding bidireccional con property binding
- Event binding para capturar acciones del usuario

#### Controller
- **Services**: `RecepcionBolsinApiService`
- Comunicación HTTP con backend
- Manejo de states (cargando, error, éxito)

#### Model
- **TypeScript Interfaces**: `OpcionRecepcionVista`, `ResultadoRecepcion`, etc.
- Estructura de datos para transportar información

### 2. **Domain-Driven Design (DDD)**

Carpeta `dominio/` en backend contiene:

```
Entidades del Dominio:
├── Bolsin (raíz agregada)
├── Remito (entidad)
├── Documentacion (entidad)
├── Estado (value object)
└── Identidad (value object)
```

**Predicados del Dominio** (métodos que responden al análisis):
```typescript
estado.sosEnviado()
estado.sosRecibido()
estado.sosRecibidoYAceptado()
estado.sosAmbitoBolsin()
estado.sosAmbitoRemito()
estado.sosAmbitoDocumentacion()
```

### 3. **Repository Pattern**

Implementado a través de **Prisma Client**:
- Abstrae consultas SQL
- Proporciona type-safety
- Facilita testing con mocks

### 4. **Service Layer**

```
RecepcionBolsinApiService (Frontend)
       ↓
GestorRegistrarRecepcionBolsinService (Backend)
       ↓
Prisma Client
```

---

## 🔄 Flujo de Datos - Caso de Uso: Registrar Recepción

```
1. USUARIO SELECCIONA OPCIÓN
   └→ Component captura el evento (click)

2. COMPONENT ACTUALIZA STATE
   └→ opcionSeleccionada = OpcionRecepcionVista
   └→ confirmacionPendiente = true

3. USUARIO CONFIRMA
   └→ Component llama service.registrarRecepcion(...)

4. SERVICE HACE HTTP POST
   └→ POST /api/bolsines/:id/registrar
   └→ Body: { codigoOpcion: "CONTENIDO_IGUAL", ... }

5. BACKEND RECIBE REQUEST
   └→ RecepcionBolsinController.registrarRecepcion()

6. CONTROLLER VALIDA
   └→ GestorRegistrarRecepcionBolsinService.registrar()

7. SERVICIO APLICA LÓGICA
   ├→ Validar opción válida
   ├→ Validar estado actual del bolsín
   ├→ Crear CambioEstadoBolsin
   └→ Actualizar estado en BD

8. PERSISTENCIA
   └→ Prisma inserta/actualiza en SQLite

9. RESPUESTA HTTP
   └→ Controller devuelve { exito: true, resultado: ... }

10. FRONTEND PROCESA RESPUESTA
    ├→ Actualiza this.resultado
    ├→ Oculta confirmacionPendiente
    └→ Muestra pantalla de confirmación final

11. USUARIO VE RESULTADO
    └→ Template renderiza ResultadoRecepcion
```

---

## 📊 Modelo de Datos - Relaciones

```
ComisionMedica (1) ──→ (N) Bolsin (como origen)
ComisionMedica (1) ──→ (N) Bolsin (como destino)
ComisionMedica (1) ──→ (N) Empleado
  │
  └─→ Empleado (1) ──→ (1) Usuario
      │
      └─→ Usuario (1) ──→ (N) Sesion
  
Bolsin (1) ──→ (N) Remito
Bolsin (1) ──→ (N) CambioEstadoBolsin
  │
  ├─→ CambioEstadoBolsin.estadoId → (1) Estado
  ├─→ CambioEstadoBolsin.empleadoId → (1) Empleado
  └─→ CambioEstadoBolsin.bolsinId → (1) Bolsin

Remito (1) ──→ (N) DetalleRemito
Remito.estadoId → (1) Estado

DetalleRemito (N) ──→ (1) Documentacion
Documentacion (1) ──→ (N) DetalleRemito
Documentacion (1) ──→ (N) CambioEstadoDocumentacion
Documentacion.tipoDocumentacionId → (1) TipoDocumentacion
```

---

## 🔐 Seguridad y Auditoría

### Auditoría Integrada

Cada cambio de estado es registrado:

```typescript
// Tabla: CambioEstadoBolsin
{
  id: number,
  fechaHoraInicio: DateTime,      // Cuándo inició el estado
  fechaHoraFin: DateTime | null,  // Cuándo terminó (si corresponde)
  bolsinId: number,               // Qué bolsín
  estadoId: number,               // Nuevo estado
  empleadoId: number              // Quién hizo el cambio
}
```

### Trazabilidad Completa
- Todos los cambios quedan registrados
- No hay borrados lógicos
- Histórico inmutable

---

## 📁 Estructura de Directorios

### Backend
```
backend/
├── src/
│   ├── app.module.ts                 # Módulo raíz
│   ├── main.ts                       # Entry point
│   │
│   ├── dominio/                      # Domain layer
│   │   ├── bolsin.ts                 # Entidad raíz agregada
│   │   ├── documentacion.ts
│   │   ├── estado.ts                 # Value object con predicados
│   │   ├── identidad.ts
│   │   └── dominio.spec.ts           # Tests del dominio
│   │
│   ├── recepcion-bolsin/             # Feature module
│   │   ├── recepcion-bolsin.module.ts
│   │   ├── recepcion-bolsin.controller.ts
│   │   ├── gestor-registrar-recepcion-bolsin.service.ts
│   │   ├── recepcion-bolsin.modelos.ts
│   │   └── recepcion-bolsin.modelos.ts
│   │
│   └── prisma/
│       ├── prisma.module.ts
│       └── prisma.service.ts         # PrismaClient wrapper
│
├── prisma/
│   ├── schema.prisma                 # Definición de BD
│   ├── migrations/
│   │   └── 20260618000000_inicial/
│   │       └── migration.sql
│   ├── migration_lock.toml
│   └── seed.ts                       # Población de datos
│
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── package.json
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── jest.config.js
```

### Frontend
```
frontend/
├── src/
│   ├── index.html
│   ├── main.ts                       # Bootstrap
│   ├── styles.css                    # Estilos globales
│   │
│   └── app/
│       ├── app.component.ts
│       │
│       └── recepcion-bolsin/         # Feature module
│           ├── pantalla-registrar-recepcion-bolsin.component.ts
│           ├── pantalla-registrar-recepcion-bolsin.component.html
│           ├── pantalla-registrar-recepcion-bolsin.component.css
│           ├── pantalla-registrar-recepcion-bolsin.component.spec.ts
│           ├── recepcion-bolsin-api.service.ts
│           └── recepcion-bolsin.modelos.ts
│
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
└── package.json
```

---

## 🔌 Puertos y Endpoints

### Backend - NestJS

**Puerto**: 3000

**Endpoints API**:
```
GET    /api/bolsines
GET    /api/bolsines/:id
GET    /api/bolsines/:id/detalle
POST   /api/bolsines/:id/registrar
```

### Frontend - Angular Dev Server

**Puerto**: 4200
**URL**: http://localhost:4200

---

## 🧪 Testing Architecture

### Backend (Jest)

```
backend/
├── src/
│   ├── dominio/
│   │   └── dominio.spec.ts           # Tests del dominio
│   │
│   └── recepcion-bolsin/
│       └── *.spec.ts                 # Tests de servicios
│
└── test/
    └── app.e2e-spec.ts               # Tests E2E
```

**Configuración**: `jest.config.js` + `test/jest-e2e.json`

### Frontend (Karma + Jasmine)

```
frontend/
└── src/app/
    └── recepcion-bolsin/
        └── *.spec.ts                 # Tests del componente
```

**Configuración**: `angular.json` (karma preset)

---

## 🚀 Deployment

### Build Steps

```bash
# Compilar
npm run build

# Resultado
dist/
├── backend/          # Aplicación NestJS compilada
│   └── main.js
│
└── frontend/         # Aplicación Angular compilada
    └── index.html
    └── main.*.js
    └── styles.*.css
```

### Requisitos en Producción
- Node.js 18+ (para backend)
- Web server (nginx/Apache para frontend)
- Base de datos compatible (PostgreSQL recomendado)

---

## 📈 Métricas de Código

### Complejidad Ciclomática

**Frontend Component**: Media
- Un selector de opciones simple
- Lógica lineal sin branching

**Backend Service**: Baja-Media
- Métodos aún sin implementación completa
- Predicados del dominio: Baja

### Cobertura de Tests
- Dominio: Parcial (dominio.spec.ts existe)
- Servicios: No implementada
- E2E: No implementada

---

## 🔄 Ciclo de Desarrollo

```
1. Feature Branch
   └─ git checkout -b feature/nombre

2. Implementar
   ├─ Backend (servicios + tests)
   ├─ Frontend (componentes + tests)
   └─ DB (migraciones si aplica)

3. Testing Local
   ├─ npm run test
   └─ npm run test:e2e

4. Git Commit
   └─ Mensaje siguiendo convenciones

5. Pull Request
   ├─ Descripción clara
   ├─ Tests pasando
   └─ Code review

6. Merge a Main
   └─ Deploy automático (si CI/CD configurado)
```

---

## 📚 Decisiones Arquitectónicas

| Decisión | Razón | Implicación |
|----------|-------|-------------|
| **NestJS** | Framework progresivo, tipado, para PPAI | Estructura clara, fácil testing |
| **Angular 19** | Framework moderno, robusto | SPA responsivo, componentes reutilizables |
| **Prisma** | ORM moderno con migraciones | Type-safe queries, migrations versionadas |
| **SQLite (Dev)** | Sin dependencias externas | Fácil local development |
| **Monorepo (npm workspaces)** | Un único repositorio | Código compartido, builds coordinados |
| **TypeScript** | Type-safety | Menos bugs, mejor refactoring |
| **RxJS** | Patrones reactivos | Mejor manejo de eventos async |

---

**Última actualización**: 24/06/2026
