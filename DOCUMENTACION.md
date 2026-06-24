# Documentación del Proyecto PPAI - Recepción de Bolsines

## 📋 Descripción General

Proyecto desarrollado para la **Práctica Profesional de Análisis e Implementación (PPAI)** que implementa un sistema de recepción y gestión de bolsines en una comisión médica.

El sistema permite:
- Registrar la recepción de bolsines (paquetes de remitos)
- Validar documentación asociada
- Gestionar estados de bolsines, remitos y documentación
- Registrar cambios de estado con trazabilidad de usuarios y fechas

---

## 🏗️ Estructura del Proyecto

```
TPDISE-O/
├── backend/                    # Aplicación NestJS
│   ├── src/
│   │   ├── dominio/           # Modelos del dominio
│   │   ├── prisma/            # Configuración de BD
│   │   ├── recepcion-bolsin/  # Lógica de recepción
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma      # Esquema de base de datos
│   │   ├── migrations/        # Migraciones de BD
│   │   └── seed.ts            # Datos iniciales
│   └── test/                  # Tests E2E
│
├── frontend/                   # Aplicación Angular
│   ├── src/
│   │   ├── app/
│   │   │   └── recepcion-bolsin/
│   │   │       ├── pantalla-registrar-recepcion-bolsin.component.ts
│   │   │       ├── pantalla-registrar-recepcion-bolsin.component.html
│   │   │       ├── recepcion-bolsin-api.service.ts
│   │   │       └── recepcion-bolsin.modelos.ts
│   │   ├── index.html
│   │   └── main.ts
│   └── angular.json
│
└── package.json               # Monorepo workspace
```

---

## 📦 Tecnologías Utilizadas

### Backend
- **NestJS 11** - Framework Node.js progresivo
- **Prisma 6.5** - ORM y generador de cliente BD
- **SQLite** - Base de datos (desarrollo)
- **Jest** - Testing unitario y E2E
- **TypeScript 5.7** - Lenguaje tipado

### Frontend
- **Angular 19** - Framework web
- **TypeScript 5.7**
- **RxJS 7.8** - Programación reactiva
- **Jasmine/Karma** - Testing

### General
- **npm workspaces** - Monorepo
- **Node.js** - Runtime

---

## 🗄️ Modelo de Datos

### Entidades Principales

#### **ComisionMedica**
- Centro de salud que envía y recibe bolsines
- Contiene empleados
- Participa como origen y destino en bolsines

#### **Bolsin**
- Paquete de remitos con trazabilidad
- Atributos: fecha, número de bolsín, número de precinto, peso
- Relaciona comisiones médicas origen y destino
- Puede contener múltiples remitos

#### **Remito**
- Documento que agrupa documentación
- Tiene estado y pertenece a un bolsín

#### **Documentacion**
- Piezas documentales individuales
- Tipos: turnos, internaciones, etc.
- Tiene trazabilidad de cambios de estado

#### **Estado**
- Catálogo compartido de estados
- Atributos: Nombre, Ámbito (BOLSIN, REMITO, DOCUMENTACION)
- Predicados: sosEnviado(), sosRecibido(), etc.

#### **Usuario/Sesion**
- Gestión de login de empleados
- Registro de sesiones activas

#### **CambioEstado***
- Auditoría de cambios de estado
- Registra: empleado, fecha/hora inicio-fin, estado anterior

---

## ✨ Cambios Recientes (Últimos 6 commits)

### Commit: f68ca8d - "Opciones flujo principal SIN backend implementado"
**Fecha**: 20/06/2026

Implementación de opciones en el flujo principal de recepción:

#### Frontend (`frontend/`)
- **PantallaRegistrarRecepcionBolsin.component.ts**
  - Agregadas opciones de recepción (CONTENIDO_IGUAL, FALTA_DOCUMENTACION, DOCUMENTACION_NO_CORRESPONDE, CONTENIDO_DIFERENTE)
  - Incluye soporte para mostrar pantalla de confirmación
  - Estados visuales para cargando, error, resultado
  
- **pantalla-registrar-recepcion-bolsin.component.html**
  - Nueva sección de opciones interactivas
  - Interfaz para seleccionar resultado de recepción
  - Pantalla de confirmación de la acción
  
- **pantalla-registrar-recepcion-bolsin.component.css**
  - Estilos para botones de opciones
  - Diseño responsive para formulario

- **recepcion-bolsin.modelos.ts**
  - Nuevo modelo `OpcionRecepcionVista` con código y descripción
  - Modelo `ResultadoRecepcion` para capturar el resultado

- **tsconfig.json**
  - Actualización de configuración TypeScript

#### Backend (`backend/`)
- **gestor-registrar-recepcion-bolsin.service.ts**
  - Placeholder para procesamiento de opciones en backend

### Commit: 9315f3f - "Opciones flujo principal SIN backend implementado"
**Fecha**: 20/06/2026

Preparación de estructura en backend para opciones.

### Commit: ec18e73 - "Cambio metodo BuscarUsuarioLogueado a una sola responsabilidad"
**Fecha**: Anterior

Refactorización del servicio de búsqueda de usuario para mejorar cohesión.

### Commit: 1b2b514 - "Nombres estados actualizados"
**Fecha**: Anterior

Actualización de nombres de estados en el catálogo de dominios para claridad.

### Commit: edcc724 - "Agrega backend y frontend del proyecto"
**Fecha**: Anterior

Adición inicial de estructura backend (NestJS) y frontend (Angular).

### Commit: 0d8a298 - "first commit"
Commit inicial del repositorio.

---

## 🎯 Funcionalidades Implementadas

### Flujo de Recepción de Bolsin

El sistema sigue un flujo definido en diagramas de secuencia PPAI:

1. **Búsqueda de Usuario Logueado**
   - Obtiene sesión actual
   - Recupera comisión médica del usuario

2. **Solicitar Listado de Bolsines**
   - Muestra bolsines pendientes para la comisión de destino
   - Filtra por estado "Enviado"

3. **Seleccionar Bolsin**
   - Usuario elige un bolsín de la lista
   - Carga detalles: remitos y documentación

4. **Validar Documentación**
   - Revisa integridad de documentación
   - Verifica correspondencia con destino

5. **Registrar Recepción**
   - Usuario selecciona opción de resultado:
     - CONTENIDO_IGUAL: Todo correcto
     - FALTA_DOCUMENTACION: Faltan documentos
     - DOCUMENTACION_NO_CORRESPONDE: Docs para otra CM
     - CONTENIDO_DIFERENTE: Discrepancias en contenido
   - Registra cambio de estado con auditoría

6. **Confirmación**
   - Muestra resumen de la acción
   - Permite confirmar o cancelar

---

## 🚀 Instrucciones de Instalación y Ejecución

### Requisitos Previos
- Node.js 18+
- npm 9+
- SQLite3 (opcional, Prisma lo maneja)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/DividedZeroH/TPDISE-O.git
cd TPDISE-O

# Instalar dependencias
npm install

# Generar cliente Prisma
npm run prisma:generate

# Aplicar migraciones BD
npm run db:migrate

# Cargar datos iniciales
npm run db:seed
```

### Ejecución en Desarrollo

```bash
# Terminal 1 - Backend (puerto 3000)
npm run dev:backend

# Terminal 2 - Frontend (puerto 4200)
npm run dev:frontend
```

Acceder a: http://localhost:4200

### Build para Producción

```bash
npm run build
```

### Ejecución de Tests

```bash
# Todos los tests
npm run test

# Tests unitarios backend
npm run test --workspace backend

# Tests E2E backend
npm run test:e2e --workspace backend

# Tests frontend
npm run test --workspace frontend -- --watch=false
```

---

## 🔗 Modelos de Vista (Interfaces Frontend)

```typescript
// Respuestas del API
interface ComisionMedicaVista {
  id: number;
  nombre: string;
}

interface BolsinVista {
  id: number;
  numeroBolsin: string;
  fecha: string;
  comisionOrigen: ComisionMedicaVista;
  comisionDestino: ComisionMedicaVista;
}

interface DetalleBolsinVista {
  bolsin: BolsinVista;
  remitos: RemitoVista[];
}

interface OpcionRecepcionVista {
  codigo: string;
  descripcion: string;
}

interface ResultadoRecepcion {
  codigoOpcion: string;
  descripcion: string;
  timestamp: string;
}
```

---

## 📝 Notas de Implementación

### Estado Actual
- Backend: Estructura lista, servicios con lógica parcial
- Frontend: Interfaz principal implementada con todas las opciones visibles
- BD: Esquema completo con migraciones aplicables

### Pendiente (Marcado en código)
- Implementación completa de lógica de validación en backend
- Integración de todas las opciones de recepción en servicios backend
- Tests automatizados para los nuevos flujos

### Convenciones de Código
- **Clases**: PascalCase
- **Métodos**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Propiedades privadas**: prefijo `_`
- Documentación de clases boundary según diagrama de análisis

---

## 🔐 Seguridad

### Base de Datos
- Validación mediante Prisma
- Migraciones versionadas
- Seed script para datos de prueba

### API
- Sin autenticación implementada (PPAI educativo)
- Sesiones en BD (estructura lista)
- CORS configurado en NestJS

### Auditoría
- Trazabilidad de cambios de estado
- Registro de empleado y timestamp en cada cambio
- Histórico completo en tabla `CambioEstado*`

---

## 📚 Referencias

- [Documentación NestJS](https://docs.nestjs.com)
- [Documentación Angular](https://angular.io/docs)
- [Documentación Prisma](https://www.prisma.io/docs)
- [Especificación TypeScript](https://www.typescriptlang.org/docs)

---

**Última actualización**: 24/06/2026  
**Rama actual**: main  
**Versión**: 1.0.0 (en desarrollo)
