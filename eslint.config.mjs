// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Configuración única para todo el monorepo (ESLint 9, flat config).
 *
 * Hay una sola regla de capa: las entidades de `domain/` son TypeScript puro.
 * Todo lo demás (controllers, services, entidades ORM) es NestJS clásico y no
 * necesita reglas especiales.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'frontend/.angular/**',
      'backend/src/database/migrations/**',
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      // El proyecto usa nombres del diagrama UML, así que no se fuerza
      // convención de nombres sobre propiedades.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ---- Única regla de capa: el dominio no conoce al framework ni al ORM ----
  {
    files: ['backend/src/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['typeorm', 'typeorm/*', '@nestjs/*'],
              message:
                'Las entidades de dominio no dependen del framework ni del ORM: los decoradores de TypeORM van en persistence/*.orm-entity.ts y el mapper traduce entre ambos.',
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
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'backend/src/database/seeds/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);
