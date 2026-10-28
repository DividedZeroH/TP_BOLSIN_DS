# Principios de diseño: revisión y correcciones

Rama `fix/principios_diseño`, creada desde `main` (`4575725 Arquitectura modular en capas`).

**Fuente de los principios:** *2026 Principios de Diseño OO* (Judith Meles), diapositiva 82
"Principios de Diseño que vimos": DRY, Tell don't ask, Principle of least knowledge (Demeter),
Composite Reuse, Program to Interface, YAGNI, KISS y SOLID (SRP, OCP / encapsular lo que varía,
LSP, ISP, DIP). También se tuvieron en cuenta la Separación de Intereses (SoC, diapositivas 9-13)
y los "Principios para implementación en POO" de la diapositiva 83: convenciones de código,
métodos cortos y principio del menor asombro.

**Restricción respetada.** El README de `main` dice que la arquitectura en capas fue *solicitada*,
y la regla `arquitectura/capas` (`tools/architecture.cjs`) la hace cumplir:

- las entidades solo tienen datos y decoradores;
- la lógica vive en servicios;
- cada repositorio tiene interfaz y token.

Todas las correcciones se hicieron dentro de esa arquitectura y pasan esa regla de lint.

## Resumen

| Principio | ¿Se violaba? | ¿Corregido? |
|---|---|---|
| DRY | Sí | Sí |
| KISS | Sí | Sí |
| Ley de Demeter (menor conocimiento) | Sí | Sí |
| Separación de intereses (SoC) | Sí | Sí |
| SRP (responsabilidad única) | Sí | Sí |
| ISP (segregación de interfaces) | Sí | Sí |
| YAGNI | Sí | Sí, en parte (ver pendientes) |
| Convenciones / menor asombro / métodos cortos | Sí | Sí |
| Tell, don't ask | Sí | **No**: lo impone la arquitectura solicitada |
| OCP / encapsular lo que varía | Parcial | **No**: hoy sería YAGNI |
| Program to Interface (trampa "una interfaz para todo") | Parcial | **No**: lo exige la regla de lint |
| DIP | No | — (cumple) |
| Composite Reuse | No | — (cumple) |
| LSP | No | — (no hay herencia) |

---

## Principios violados y corregidos

### 1. DRY: No te repitas

> "Cada requerimiento en un único lugar."

**a) Los nombres de estado estaban repetidos fuera del catálogo.**

- *Violación.* `EstadoService` ya comparaba los nombres en sus predicados (`sosRecibido()`, ...),
  pero el gestor los volvía a escribir como literales en tres lugares:
  - en las consultas `buscarPorNombreYAmbito('Recibido', 'BOLSIN')`;
  - en `buscarPorNombreYAmbito('RecibidoYAceptado', 'REMITO' | 'DOCUMENTACION')`;
  - en el resultado (`estadoBolsin: 'Recibido'`, `estadoRemitos: 'RecibidoYAceptado'`, ...).

  Cambiar un nombre del catálogo obligaba a tocar varios archivos.
- *Corrección.* Los nombres quedan **solo** en los predicados de `EstadoService`. El gestor busca
  el estado con esos predicados, y el resultado toma los nombres del registro encontrado
  (`armarResultado()`).
- Archivos: `estados/service/estado.service.ts`, `estados/repository/*`,
  `recepcion-bolsin/service/gestor-registrar-recepcion-bolsin.service.ts`.

**b) La persistencia del historial de estados estaba duplicada.**

- *Violación.* `BolsinesRepository.guardarCambiosEstado()` y
  `DocumentacionesRepository.guardarCambiosEstado()` tenían el mismo algoritmo copiado: insertar
  los cambios nuevos y cerrar con `fechaHoraFin` el que dejó de ser actual.
- *Corrección.* El algoritmo vive en un único lugar, `database/historial-estados.ts`
  (`guardarHistorialEstados()`), y los dos repositorios lo usan.

**c) El mapeo de `ComisionMedica` se repetía cuatro veces.**

- *Violación.* `{ id, nombre: comisionesMedicasService.getNombre(...) }` aparecía en
  `nuevaRecepcionBolsin`, `buscarComisionMedicaBolsin`, `consultarRecepcion` y `resumir`.
- *Corrección.* Se extrajo el método privado `aComisionMedicaDto()`.

**d) En el frontend, la misma guarda estaba copiada en tres acciones.**

- *Violación.* `tomarBolsin`, `tomarOpcion` y `tomarConfirmacion` repetían
  `this.confirmando || this.finalizando || this.modal?.tipo === 'exito'`.
- *Corrección.* Se reemplazó por el getter `bloqueada`.

**e) La URL del backend y la sesión fija estaban en un solo servicio.**

- *Violación.* `'http://localhost:3000/api'` y `SESION_ID` estaban dentro de
  `RecepcionBolsinService`. Al separar el servicio de sesión (ver ISP), se iban a duplicar.
- *Corrección.* Ambos valores se definen una sola vez, en `frontend/src/app/api.ts`.

### 2. KISS: Mantenelo simple

**a) La búsqueda de estados validaba dos veces lo mismo.**

- *Violación.* `buscarEstadoRecibidoBolsin()` y `buscarEstadosRecibidoYAceptado()` hacían dos
  cosas que se pisaban:
  - consultaban por nombre y ámbito en SQL;
  - y después volvían a preguntar `sosAmbito...()` y `sos...()` sobre el resultado, que por
    construcción ya cumplía.

  En el segundo método eran 33 líneas y cuatro `if` para lanzar un 404.
- *Corrección.* Ahora se trae el catálogo y se lo recorre con los predicados, una sola vez.
  Además es exactamente lo que modela el diagrama de secuencia: `Gestor->>Estado: *sosAmbitoBolsin()`
  y `*sosRecibido()`, donde el asterisco indica iteración sobre los estados.

**b) Había un tipo auxiliar innecesario para obtener el número de remito.**

- *Violación.* Para mostrar el número de remito de cada documentación se usaban dos piezas:
  - un tipo `RemitoParaRecepcion { remito, numero }`;
  - un método `remitoDe()` que buscaba linealmente y lanzaba `Error`.
- *Corrección.* Se arma un `Map` de id de remito a número, usando `buscarRemitoBolsin()` y
  `getNumero()`, que conservan los mensajes del diagrama.

**c) Un parámetro se pasaba siempre vacío.**

- *Violación.* `recepciones.crear({ ..., bolsines: [] })` recibía un parámetro que siempre valía `[]`.
- *Corrección.* Ahora el repositorio inicializa la lista.

### 3. Ley de Demeter: principio de menor conocimiento

> "Hablá solo con tus amigos inmediatos."

- *Violación.* `actualizarDocumentacion()` recorría el grafo completo
  bolsín → remitos → detalles → documentación:

  ```ts
  bolsin.remitos.flatMap((remito) => remito.detalles.map((detalle) => detalle.documentacion))
  ```

  El propio código lo admitía con el comentario "Extracción técnica para persistir".
  `actualizarEstadoRemito()` también accedía directamente a `bolsin.remitos`.
- *Corrección.* El gestor ahora usa sus propios mensajes del diagrama:
  - `buscarDocumentacionBolsin(bolsin)`, que delega en `BolsinesService` → `RemitosService`;
  - `buscarRemitoBolsin(bolsin)`.

  El gestor ya no conoce la estructura interna del bolsín.

### 4. Separación de intereses (SoC)

- *Violación.* El repositorio en memoria (`RecepcionEnCursoRepository.obtener()`) lanzaba
  `NotFoundException`, una excepción HTTP. La capa de datos decidía la respuesta de la API.
- *Corrección.* El repositorio ahora tiene `buscar()`, que devuelve `undefined` si la recepción no
  existe o venció. Decidir que eso es un 404 le corresponde al gestor (`obtenerRecepcion()`), al
  igual que pasa con los demás repositorios del proyecto.

### 5. SRP: Responsabilidad única

> "Una única razón para cambiar."

- *Violación.* `RecepcionBolsinService` (frontend) tenía dos razones para cambiar:
  - el flujo del CU28;
  - la consulta de sesión que usa el panel (`comisionDeSesion`).

  Además, `SesionVista` vivía en los modelos de recepción.
- *Corrección.* Se creó `sesion/sesion.service.ts`, con `SesionService.comisionDeSesion()`, y los
  modelos `sesion/sesion.modelos.ts`. El servicio de recepción quedó solo con los mensajes del CU28.
- Además, en el gestor el armado del resultado se extrajo de `tomarConfirmacion()` a
  `armarResultado()`.

### 6. ISP: Segregación de interfaces

> "No obligar a los clientes a depender de métodos que no utilizan."

- *Violación.* `PanelComponent` dependía de `RecepcionBolsinService` completo, con siete métodos
  del CU28, para usar uno solo (`comisionDeSesion`).
- *Corrección.* Ahora depende de `SesionService`, que expone solo ese método.

### 7. YAGNI: No lo vas a necesitar

- *Violación.* Había getters que nadie llamaba y que **no figuran en el diagrama de clases**:

  | Servicio | Métodos eliminados |
  |---|---|
  | `RemitosService` | `getEstado()`, `getCMOrigen()`, `getCMDestino()` |
  | `BolsinesService` | `getCambiosEstado()` |
  | `DocumentacionesService` | `getCMOrigen()`, `getCambiosEstado()` |

- *Corrección.* Se eliminaron. Los métodos que sí están en el diagrama se conservaron aunque el
  CU28 no los use; ver pendientes.

### 8. Principios de implementación: convenciones, menor asombro y métodos cortos

**a) El repositorio en memoria no seguía la convención de nombres del resto.**

- *Violación.* Todos los repositorios siguen el formato `XRepositoryInterface` + token
  `X_REPOSITORY` + archivo `x.repository.ts`. El de recepciones mezclaba nombres:

  | Elemento | Antes | Ahora |
  |---|---|---|
  | Interfaz | `RecepcionesEnCurso` | `RecepcionesEnCursoRepositoryInterface` |
  | Token | `RECEPCIONES_EN_CURSO` | `RECEPCIONES_EN_CURSO_REPOSITORY` |
  | Clase | `RecepcionEnCursoRepository` (singular) | `RecepcionesEnCursoRepository` |
  | Archivo | `recepcion-en-curso.repository.ts` | `recepciones-en-curso.repository.ts` |

- *Corrección.* Se renombraron según la tabla, y el README se actualizó en consecuencia.

**b) Un nombre de método no decía lo que hacía (menor asombro).**

- *Violación.* `obtener()` sugería una lectura, pero lanzaba una excepción HTTP.
- *Corrección.* Ahora es `buscar()` y devuelve `undefined` cuando no encuentra nada.

**c) Convención de archivo en la entidad Estado.**

- *Violación.* `estado.entity.ts` declaraba el tipo `AmbitoEstado` antes de los `import`.
- *Corrección.* Se reordenó: primero los imports y después el tipo.

**d) Métodos largos (regla 7 ± 2).**

- *Violación.* `buscarEstadosRecibidoYAceptado()` tenía 33 líneas y `tomarConfirmacion()` armaba
  el resultado en línea.
- *Corrección.* Ambos se acortaron, gracias a las correcciones de KISS y SRP.

---

## Detectados pero no corregidos (con motivo)

### Tell, don't ask

> "No usar los objetos para pedirles cosas; decirles que hagan cosas."

El modelo es anémico: las entidades son solo datos y toda la lógica está en servicios que reciben
la entidad como parámetro, por ejemplo `bolsinesService.sosEnviado(bolsin)` o
`remitosService.getNumero(remito)`. Es literalmente "pedirle cosas" al objeto, y también se aleja
del patrón Experto.

**No se corrigió** porque es la arquitectura solicitada, documentada en el README, y la regla
`arquitectura/capas` prohíbe métodos en `entity/`. Revertirlo es una decisión del grupo y de la
cátedra, no un arreglo puntual.

### OCP / Encapsular lo que varía

Agregar una opción de recepción implementada (`FALTA_DOCUMENTACION`, etc.) obligaría a modificar
`tomarConfirmacion()`. `MANEJADORES_OPCION_RECEPCION` describe las opciones, pero no encapsula su
comportamiento.

**No se corrigió** porque hoy hay una sola opción implementada, y meter un Strategy para un único
caso iría contra YAGNI y KISS. Cuando se implementen los flujos A1–A6, cada opción debería tener su
propio `ejecutar(...)` y el gestor debería delegar en él.

### Program to Interface: la trampa "una interfaz para todo"

Cada repositorio tiene una interfaz y un token, aunque haya una sola implementación. Según las
"dos reglas para pensar" del PDF:

- **Repositorios de base de datos: justificado.** Desacoplan el sistema de uno externo (PostgreSQL
  y TypeORM), que es la regla 2.
- **`RecepcionesEnCursoRepositoryInterface`: no justificado por esas reglas.** Es un `Map` en
  memoria, sin sistema externo ni segunda implementación.

Se mantuvo igual porque la regla de lint exige que los servicios inyecten interfaces de
repositorio.

### DRY: duplicación que refleja el diagrama

- `CambioEstadoBolsinService` y `CambioEstadoDocumentacionService` repiten `sosActual()` y
  `setFechaHoraFin()`.
- `BolsinesService` y `DocumentacionesService` repiten `crearCambioEstado()` y `getEstadoActual()`.

Corresponden a **clases distintas del diagrama de clases**, y el README mapea una clase a un
servicio. Unificarlas rompería esa trazabilidad, que es lo que evalúa la cátedra. La parte de
persistencia, que no está en el diagrama, sí se unificó (punto 1.b).

### YAGNI: métodos vacíos del diagrama

`revision()`, `darDeBaja()`, `actualizarAsignacionDeRemito()`, `actualizarAsignacionDeBolsin()` y
`retirarDeBolsin()` están vacíos, pero figuran en el diagrama de clases de `Documentacion`. Se
conservan por fidelidad al modelo. Solo se aclaró el comentario.

---

## Principios que ya se cumplían

- **DIP.** El gestor (alto nivel) depende de abstracciones para todo lo de infraestructura:
  `UNIDAD_DE_TRABAJO` y los contratos de repositorio. Ningún servicio importa TypeORM, y la regla
  de lint lo garantiza. Que dependa de servicios concretos de otros módulos es lo habitual en NestJS
  y no viola la premisa A.
- **Composite Reuse.** No hay herencia. El reuso es por composición y delegación:
  gestor → `BolsinesService` → `RemitosService` → `DetalleRemitoService` → `DocumentacionesService`.
- **LSP.** No hay jerarquías de herencia que sustituir, y las implementaciones de repositorio
  respetan sus contratos.

## Verificación

| Comprobación | Resultado |
|---|---|
| `npm run lint` (incluye `arquitectura/capas`) | Sin errores |
| `npm run build` (backend y frontend) | OK |
| Flujo completo por la API contra Postgres (PGlite) | OK; detalle abajo |
| Estado en la base después de confirmar el precinto 1 | Correcto; detalle abajo |

Pasos del flujo por la API, después de `db:migrate` y `db:seed`:

1. Inicio de la recepción.
2. Listado de bolsines.
3. `tomarBolsin`.
4. Opción no implementada: devuelve 400.
5. `tomarOpcion`.
6. `tomarConfirmacion`.
7. Reintento idempotente de la confirmación.
8. `finDelCU`: devuelve 204.
9. La recepción consultada después del fin devuelve 404.
10. Cancelar una recepción inexistente devuelve 404.
11. Endpoint del panel.

Estado en la base después de confirmar el precinto 1:

- El cambio de bolsín `Enviado` quedó cerrado y el de `Recibido` es el actual.
- Los dos remitos quedaron en `RecibidoYAceptado`.
- Las 4 documentaciones tienen `EnBolsinEnviado` cerrado y `RecibidoYAceptado` como actual.

**No verificado:**

- `main` ya no tiene tests automáticos (se eliminaron en "Arquitectura modular en capas"), así que
  no hay suite que correr.
- El frontend se compiló, pero no se probó en el navegador.
