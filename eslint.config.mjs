// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Configuración única para todo el monorepo (ESLint 9, flat config).
 *
 * Reparto de responsabilidades para hacer cumplir la arquitectura:
 *
 * - Acá viven las reglas de CAPA (dominio / aplicación / infraestructura),
 *   porque son las que conviene ver subrayadas en el editor mientras escribís.
 * - En `backend/src/arquitectura.spec.ts` viven las reglas de MÓDULO (que
 *   ningún subdominio alcance el interior de otro, que cada uno exponga su
 *   API pública). Necesitan resolver rutas relativas y escalan solas cuando se
 *   agrega un módulo nuevo, cosa que un patrón glob no hace.
 *
 * Las dos corren en CI.
 */

const FRAMEWORKS = ['@nestjs/*', '@prisma/client', 'prisma'];

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'frontend/.angular/**',
      'backend/prisma/migrations/**',
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      // El proyecto usa nombres del diagrama UML (Numero, Nombre, Ambito),
      // así que no se fuerza convención de nombres sobre propiedades.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ---- Regla de dependencia hexagonal: capa de dominio ----
  {
    files: ['backend/src/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/application/**', '**/infrastructure/**'],
              message:
                'El dominio no puede depender de aplicación ni de infraestructura (regla de dependencia hexagonal).',
            },
            {
              group: FRAMEWORKS,
              message:
                'El dominio es TypeScript puro: no puede depender de NestJS ni de Prisma.',
            },
          ],
        },
      ],
    },
  },

  // ---- Regla de dependencia hexagonal: capa de aplicación ----
  {
    files: ['backend/src/**/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/infrastructure/**'],
              message:
                'La capa de aplicación no puede depender de infraestructura: definí un puerto.',
            },
            {
              group: FRAMEWORKS,
              message:
                'La capa de aplicación no depende de frameworks. Usá errores propios en vez de excepciones HTTP y puertos en vez de servicios de NestJS.',
            },
          ],
        },
      ],
    },
  },

  // Archivos de configuración en CommonJS (jest.config.js, karma.conf.js).
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'writable',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Los tests y las semillas pueden usar lo que necesiten.
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'backend/prisma/seed.ts'],
    rules: {
      'no-restricted-imports': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
