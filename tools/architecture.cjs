const path = require('node:path');

/** Controller → service → contrato propio → repository. Entity contiene solo datos. */
const capas = {
  meta: {
    type: 'problem',
    schema: [],
    messages: { capa: '{{motivo}}' },
  },
  create(context) {
    const filename = context.filename.replace(/\\/g, '/');
    const origen = filename.match(/\/modules\/([^/]+)\/(.+)$/);
    if (!origen) return {};
    const [, modulo, archivo] = origen;
    const esService = archivo.includes('service/') || archivo.endsWith('.service.ts');
    const esController = archivo.endsWith('.controller.ts');
    const esPresentacion = archivo.includes('controller/');
    const esRepository = archivo.includes('repository/');
    const esEntity = archivo.includes('entity/');
    function revisar(node, source) {
      if (typeof source !== 'string') return;
      const destino = source.startsWith('.')
        ? path.posix.resolve(path.posix.dirname(filename), source)
        : source;
      const otro = destino.match(/\/modules\/([^/]+)\/(.+)$/);
      const orm = /^(typeorm(?:\/|$)|@nestjs\/typeorm(?:\/|$))/.test(source);
      const datos =
        /\/(domain|persistence|mapper)\/|\.orm-entity(?:\.|$)|\/database\//.test(destino);
      const repo = otro && otro[2].includes('repository/');
      const interfaz = /\.interface(?:\.|$)/.test(destino);
      let motivo;
      if (archivo.endsWith('.repository.interface.ts') && (orm || datos)) {
        motivo = 'Los contratos de repositorio no exponen tipos ni dependencias del ORM.';
      } else if (
        esEntity &&
        (source.startsWith('@nestjs/') || (otro && !otro[2].includes('entity/')) || datos)
      ) {
        motivo = 'Las entidades solo definen datos, relaciones y decoradores de TypeORM.';
      } else if ((esService || esPresentacion) && (orm || datos)) {
        motivo =
          'Presentación y negocio no usan utilidades de TypeORM ni conexiones; operan con entity y contratos.';
      } else if (
        esController &&
        (repo ||
          (otro && (otro[1] !== modulo || !/^(service|controller)\//.test(otro[2]))))
      ) {
        motivo = 'El controller delega exclusivamente en servicios y DTOs de su módulo.';
      } else if (esService && repo && (otro[1] !== modulo || !interfaz)) {
        motivo =
          'Un servicio solo inyecta interfaces de repositorio de su propio módulo.';
      } else if (
        esService &&
        otro &&
        otro[1] !== modulo &&
        !/^(service|entity)\//.test(otro[2])
      ) {
        motivo = 'Los servicios de otros módulos se consumen por su servicio público.';
      } else if (
        esRepository &&
        otro &&
        (/^(service|controller)\//.test(otro[2]) ||
          ((repo || (otro[2].includes('entity/') && node.importKind !== 'type')) &&
            otro[1] !== modulo))
      ) {
        motivo =
          'El repositorio no consume servicios ni repositorios ajenos; solo persiste las entidades propias.';
      }
      if (motivo) context.report({ node, messageId: 'capa', data: { motivo } });
    }
    return {
      Program(node) {
        if (/^(domain|persistence|mapper|store|dto)\//.test(archivo)) {
          context.report({
            node,
            messageId: 'capa',
            data: {
              motivo:
                'El módulo se organiza en controller, service, entity y repository.',
            },
          });
        }
      },
      MethodDefinition(node) {
        if (esEntity)
          context.report({
            node,
            messageId: 'capa',
            data: {
              motivo:
                'Los métodos y constructores de negocio pertenecen al service, no a entity.',
            },
          });
      },
      PropertyDefinition(node) {
        if (
          esEntity &&
          node.value &&
          ['ArrowFunctionExpression', 'FunctionExpression'].includes(node.value.type)
        ) {
          context.report({
            node,
            messageId: 'capa',
            data: {
              motivo: 'Las funciones de negocio pertenecen al service, no a entity.',
            },
          });
        }
      },
      NewExpression(node) {
        if ((esService || esRepository) && node.callee.name === 'Estado') {
          context.report({
            node,
            messageId: 'capa',
            data: {
              motivo:
                'El catálogo de estados se obtiene de la BD y se carga mediante el seed.',
            },
          });
        }
      },
      ImportDeclaration(node) {
        revisar(node, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) revisar(node, node.source.value);
      },
      ExportAllDeclaration(node) {
        revisar(node, node.source.value);
      },
      ImportExpression(node) {
        revisar(node, node.source.value);
      },
      TSImportType(node) {
        revisar(node, node.source.value);
      },
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'require')
          revisar(node, node.arguments[0]?.value);
      },
      Property(node) {
        if (
          !archivo.endsWith('.module.ts') ||
          node.key.name !== 'exports' ||
          node.value.type !== 'ArrayExpression'
        )
          return;
        for (const element of node.value.elements) {
          if (
            !element ||
            element.type !== 'Identifier' ||
            !element.name.endsWith('Service')
          ) {
            context.report({
              node,
              messageId: 'capa',
              data: {
                motivo:
                  'Los módulos de entidades exportan servicios públicos, no repositorios ni tokens.',
              },
            });
          }
        }
      },
    };
  },
};
module.exports = { rules: { capas } };
