// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import arquitectura from './tools/architecture.cjs';

/**
 * Configuración única para todo el monorepo (ESLint 9, flat config).
 *
 * Las entidades contienen datos y decoradores; la lógica vive en servicios
 * públicos que consumen contratos de repositorio propios.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'frontend/.angular/**',
      'backend/src/database/migrations/**',
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['backend/src/modules/**/*.ts'],
    plugins: { arquitectura },
    rules: { 'arquitectura/capas': 'error' },
  },

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

  // Utilidades en CommonJS.
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

  // El comando de seed informa su resultado por consola.
  {
    files: ['backend/src/database/seeds/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);
