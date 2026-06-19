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

Luego, en dos terminales:

```bash
npm run dev:backend
npm run dev:frontend
```

La interfaz queda disponible en `http://localhost:4200` y la API en
`http://localhost:3000/api`.

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
# TPDISE-O
