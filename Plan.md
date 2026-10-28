# Estado actual del proyecto

La arquitectura vigente y el recorrido del CU28 están documentados en README.md.

- Backend NestJS y TypeORM con PostgreSQL 16; frontend Angular.
- Módulos por entidad principal, con controller, service, entity y repository según corresponda.
- Toda la lógica de negocio y los métodos del modelo están en service.
- Entity contiene exclusivamente atributos, relaciones y decoradores de TypeORM.
- Cada módulo persiste mediante su propio contrato de repositorio e implementación.
- Los estados se generan mediante el seed idempotente y se consultan en PostgreSQL.
- DOCUMENTACION y REMITO usan RecibidoYAceptado; una migración renombra Aceptada sin perder el historial.
- La confirmación comparte una transacción con bloqueo y revalidación del bolsín.
- CU29 se invoca después del commit y actualmente se representa mediante un log.
- La pantalla muestra la comisión antes de buscar bolsines, consulta los números de remito antes de sus documentos y conserva los mensajes de presentación separados.
- El éxito se informa antes de finDelCU; al aceptar el aviso se cierra la recepción y se vuelve al panel.
- Reintentar una confirmación ya registrada devuelve el resultado anterior sin duplicar escrituras ni CU29.
- Solo está implementado el flujo normal CONTENIDO_IGUAL.
- El esquema se modifica exclusivamente mediante migraciones.
- Se conservan los nombres de los métodos del modelo, ubicados en servicios.
- La comparación con el diagrama de secuencia del PDF está en la sección Trazabilidad del README.

El usuario solicitó retirar todas las pruebas, sus auxiliares y configuraciones.
Los controles disponibles son npm run lint y npm run build.

Para desarrollar: npm run db:up, npm run db:migrate, npm run db:seed y npm run dev.
npm run db:reset reinicia la base local borrando sus datos.
