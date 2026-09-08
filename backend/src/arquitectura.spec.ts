import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';

/**
 * Test de arquitectura: convierte la regla de dependencia hexagonal en algo
 * ejecutable.
 *
 * Sin esto, la estructura de carpetas es solo una convención que se degrada
 * en el primer import apurado. Acá falla el build.
 */

const RAIZ = __dirname;
type Capa = 'domain' | 'application' | 'infrastructure';

interface Import {
  archivo: string;
  destino: string;
}

function archivosTs(directorio: string): string[] {
  return readdirSync(directorio).flatMap((entrada) => {
    const ruta = join(directorio, entrada);
    if (statSync(ruta).isDirectory()) {
      return archivosTs(ruta);
    }
    return ruta.endsWith('.ts') && !ruta.endsWith('.spec.ts') ? [ruta] : [];
  });
}

function normalizar(rutaAbsoluta: string): string {
  return relative(RAIZ, rutaAbsoluta).split('\\').join('/');
}

function capaDe(ruta: string): Capa | null {
  const partes = ruta.split('/');
  if (partes.includes('domain')) return 'domain';
  if (partes.includes('application')) return 'application';
  if (partes.includes('infrastructure')) return 'infrastructure';
  return null;
}

function moduloDe(ruta: string): string | null {
  const partes = ruta.split('/');
  const indice = partes.indexOf('modules');
  return indice >= 0 ? (partes[indice + 1] ?? null) : null;
}

const importsRelativos: Import[] = archivosTs(RAIZ).flatMap((archivoAbsoluto) => {
  const contenido = readFileSync(archivoAbsoluto, 'utf-8');
  const expresion = /from\s+['"](\.[^'"]+)['"]/g;
  const encontrados: Import[] = [];
  let coincidencia: RegExpExecArray | null;
  while ((coincidencia = expresion.exec(contenido)) !== null) {
    encontrados.push({
      archivo: normalizar(archivoAbsoluto),
      destino: normalizar(resolve(dirname(archivoAbsoluto), coincidencia[1])),
    });
  }
  return encontrados;
});

const describir = ({ archivo, destino }: Import) => `${archivo} -> ${destino}`;

describe('Regla de dependencia hexagonal', () => {
  it('encuentra imports para analizar', () => {
    expect(importsRelativos.length).toBeGreaterThan(20);
  });

  it('el dominio no depende de aplicacion ni de infraestructura', () => {
    const violaciones = importsRelativos
      .filter(({ archivo }) => capaDe(archivo) === 'domain')
      .filter(({ destino }) => {
        const capa = capaDe(destino);
        return capa === 'application' || capa === 'infrastructure';
      });

    expect(violaciones.map(describir)).toEqual([]);
  });

  it('la aplicacion no depende de infraestructura', () => {
    const violaciones = importsRelativos
      .filter(({ archivo }) => capaDe(archivo) === 'application')
      .filter(({ destino }) => capaDe(destino) === 'infrastructure');

    expect(violaciones.map(describir)).toEqual([]);
  });

  /**
   * Monolito modular: un subdominio puede depender de otro, pero solo a través
   * de su API pública (`modules/<subdominio>/index.ts`). Alcanzar un archivo
   * interno es lo que convierte un monolito modular en una bola de barro.
   */
  it('ningun modulo alcanza el interior de otro modulo', () => {
    const violaciones = importsRelativos.filter(({ archivo, destino }) => {
      const origen = moduloDe(archivo);
      const objetivo = moduloDe(destino);
      if (origen === null || objetivo === null || origen === objetivo) {
        return false;
      }
      return destino !== `modules/${objetivo}`;
    });

    expect(violaciones.map(describir)).toEqual([]);
  });

  /** La API pública de cada subdominio es obligatoria. */
  it('cada modulo expone un index.ts', () => {
    const modulos = readdirSync(join(RAIZ, 'modules'));
    const sinApiPublica = modulos.filter(
      (modulo) => !existsSync(join(RAIZ, 'modules', modulo, 'index.ts')),
    );

    expect(sinApiPublica).toEqual([]);
  });

  /**
   * El núcleo del hexágono (dominio + aplicación) no debe depender de ningún
   * framework: ni del ORM ni de NestJS. Que el gestor lanzara
   * `NotFoundException` significaba tener semántica HTTP —un detalle de
   * transporte— metida en el caso de uso.
   */
  it.each(['domain', 'application'] as const)(
    'la capa %s no conoce Prisma ni NestJS',
    (capa) => {
      const contaminados = archivosTs(RAIZ)
        .filter((archivo) => capaDe(normalizar(archivo)) === capa)
        .filter((archivo) => {
          const contenido = readFileSync(archivo, 'utf-8');
          return (
            contenido.includes('@prisma/client') || contenido.includes('@nestjs/')
          );
        })
        .map(normalizar);

      expect(contaminados).toEqual([]);
    },
  );
});
