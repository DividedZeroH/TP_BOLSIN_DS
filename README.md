# Registrar recepción de bolsín

Implementación web del flujo normal del CU 28, construida a partir del diagrama
de clases, el diagrama de secuencia, la máquina de estados y la plantilla
funcional suministrados.

## Tecnologías

- Lenguaje: TypeScript.
- Backend: NestJS.
- Persistencia: Prisma ORM con SQLite.
- Frontend: Angular standalone.
- Tecnología: Web.

Las clases `PantallaRegistrarRecepcionBolsin` (Boundary),
`GestorRegistrarRecepcionBolsin` (Control) y las entidades del dominio conservan
los nombres y responsabilidades del modelo. Los identificadores, DTO, controlador
HTTP y adaptador de API son elementos técnicos necesarios para implementarlo como
aplicación web.

## Ejecución

Requiere Node.js 20 o superior. Desde la raíz:

```bash
npm install
npm run db:migrate
npm run db:seed
```

Luego, para levantar backend y frontend juntos en una sola terminal:

```bash
npm run dev
```

También se puede levantar cada uno por separado, en terminales distintas:

```bash
npm run dev:backend
npm run dev:frontend
```

La interfaz queda disponible en `http://localhost:4200` y la API en
`http://localhost:3000/api`.

## Migraciones y semillas

```bash
npm run db:migrate
npm run db:seed
```

`db:migrate` aplica las migraciones de Prisma (`backend/prisma/migrations`),
incluyendo el pase de `numeroPrecinto` y `Numero` de remito a tipo numérico.
`db:seed` ejecuta `backend/prisma/seed.ts` y carga un escenario repetible:
sesión `1`, comisión médica de destino y tres de origen, y cinco bolsines
(`BOL-2026-001` a `BOL-2026-005`) cada uno con sus remitos y documentación
en estado `Enviado`/`EnBolsinEnviado`, listos para recibir desde la interfaz.
Los `upsert` evitan duplicar datos al volver a correr la semilla.

## Navegación

Al ingresar se muestra el **panel de control**, con el usuario logueado y las
opciones disponibles. Desde ahí se accede a:

- `/panel` — panel de control (pantalla inicial).
- `/recepcion-bolsin` — registrar recepción de bolsín, con opción de
  **cancelar** la recepción en curso y volver al panel.

## Verificación

```bash
npm run build
npm test
npm run test:e2e --workspace backend
```

La semilla utiliza la sesión `1` e incorpora un bolsín completo para probar la
selección y confirmación. Al finalizar, el bolsín queda `Recibido`, el remito
`RecibidoYAceptado` y la documentación `Aceptada`.

Solo se implementó la opción **El contenido del bolsín es igual al registrado**.
Los flujos alternativos A1–A6 y las opciones 2–4 quedan fuera del alcance.
