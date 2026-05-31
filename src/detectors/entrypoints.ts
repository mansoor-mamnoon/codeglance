import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

export interface EntryPoint {
  relativePath: string;
  description: string;
  type: 'main' | 'server' | 'cli' | 'config' | 'infra';
}

async function fileExists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}

// Ordered candidate groups: first match in each group is taken
const NODE_CANDIDATES: Array<[string[], string, EntryPoint['type']]> = [
  [['src/index.ts', 'src/index.js', 'src/index.tsx'], 'main entry', 'main'],
  [['src/app.ts', 'src/app.js', 'app.ts', 'app.js'], 'app entry', 'main'],
  [['src/server.ts', 'src/server.js', 'server.ts', 'server.js'], 'HTTP server', 'server'],
  [['src/main.ts', 'src/main.js', 'main.ts'], 'main entry', 'main'],
  [['src/cli.ts', 'src/cli.js', 'cli.ts', 'cli.js', 'bin/cli.ts', 'bin/cli.js'], 'CLI entry', 'cli'],
  [['next.config.ts', 'next.config.js', 'next.config.mjs'], 'Next.js config', 'config'],
  [['vite.config.ts', 'vite.config.js'], 'Vite config', 'config'],
  [['svelte.config.js', 'svelte.config.ts'], 'SvelteKit config', 'config'],
  [['nuxt.config.ts', 'nuxt.config.js'], 'Nuxt config', 'config'],
  [['astro.config.mjs', 'astro.config.ts'], 'Astro config', 'config'],
  [['prisma/schema.prisma'], 'Prisma data model', 'config'],
  [['drizzle.config.ts', 'drizzle.config.js'], 'Drizzle config', 'config'],
];

const GO_CANDIDATES: Array<[string[], string, EntryPoint['type']]> = [
  [['main.go'], 'main package', 'main'],
  [['server/server.go', 'internal/server/server.go', 'pkg/server/server.go'], 'server entry', 'server'],
  [['api/api.go', 'internal/api/api.go', 'pkg/api/api.go'], 'API handler', 'server'],
  [['internal/handler/handler.go', 'pkg/handler/handler.go', 'handler/handler.go'], 'HTTP handlers', 'server'],
  [['internal/routes/routes.go', 'pkg/routes/routes.go'], 'route definitions', 'server'],
];

const RUST_CANDIDATES: Array<[string[], string, EntryPoint['type']]> = [
  [['src/main.rs'], 'binary entry', 'main'],
  [['src/lib.rs'], 'library root', 'main'],
  [['src/bin'], 'additional binaries', 'cli'],
];

const PYTHON_CANDIDATES: Array<[string[], string, EntryPoint['type']]> = [
  [['main.py'], 'app entry point', 'main'],
  [['app.py'], 'application factory', 'main'],
  [['manage.py'], 'Django management CLI', 'cli'],
  [['wsgi.py'], 'WSGI server entry', 'server'],
  [['asgi.py'], 'ASGI server entry', 'server'],
  [['src/main.py', 'src/__main__.py', '__main__.py'], 'module entry point', 'main'],
  [['api/main.py', 'app/main.py', 'src/app/main.py'], 'API entry point', 'server'],
];

const CPP_CANDIDATES: Array<[string[], string, EntryPoint['type']]> = [
  [['src/main.cpp', 'main.cpp'], 'application entry', 'main'],
  [['src/main.c', 'main.c'], 'application entry', 'main'],
  [['include/app.h', 'include/main.h', 'include/core.h'], 'public interface header', 'config'],
  [['CMakeLists.txt'], 'CMake build config', 'config'],
];

const SHARED_CANDIDATES: Array<[string[], string, EntryPoint['type']]> = [
  [['Dockerfile'], 'container definition', 'infra'],
  [['docker-compose.yml', 'docker-compose.yaml'], 'compose services', 'infra'],
  [['Makefile', 'makefile'], 'build targets', 'config'],
  [['justfile', 'Justfile'], 'task definitions', 'config'],
];

// Paths that are output artifacts, not source — skip them from entry points
const SKIP_PATH_PREFIXES = ['dist/', 'build/', 'out/', 'target/', '.next/'];

function isSourcePath(p: string): boolean {
  return !SKIP_PATH_PREFIXES.some((prefix) => p.startsWith(prefix) || p.startsWith('./' + prefix));
}

async function fromPackageJsonBin(rootDir: string): Promise<EntryPoint[]> {
  try {
    const content = await readFile(path.join(rootDir, 'package.json'), 'utf8');
    const pkg = JSON.parse(content) as { main?: string; bin?: string | Record<string, string> };
    const entries: EntryPoint[] = [];
    if (pkg.main && isSourcePath(pkg.main) && (await fileExists(path.join(rootDir, pkg.main)))) {
      entries.push({ relativePath: pkg.main, description: 'main (package.json)', type: 'main' });
    }
    if (pkg.bin) {
      if (typeof pkg.bin === 'string' && isSourcePath(pkg.bin) && (await fileExists(path.join(rootDir, pkg.bin)))) {
        entries.push({ relativePath: pkg.bin, description: 'CLI binary', type: 'cli' });
      } else if (typeof pkg.bin === 'object') {
        for (const [name, p] of Object.entries(pkg.bin)) {
          if (isSourcePath(p) && (await fileExists(path.join(rootDir, p)))) {
            entries.push({ relativePath: p, description: `CLI: ${name}`, type: 'cli' });
          }
        }
      }
    }
    return entries;
  } catch {
    return [];
  }
}

async function scanCandidates(
  rootDir: string,
  candidates: Array<[string[], string, EntryPoint['type']]>,
  seen: Set<string>,
): Promise<EntryPoint[]> {
  const results: EntryPoint[] = [];
  for (const [files, description, type] of candidates) {
    for (const file of files) {
      if (seen.has(file)) continue;
      if (await fileExists(path.join(rootDir, file))) {
        results.push({ relativePath: file, description, type });
        seen.add(file);
        break; // first match per group
      }
    }
  }
  return results;
}

async function scanGoCmdDir(rootDir: string, seen: Set<string>): Promise<EntryPoint[]> {
  const results: EntryPoint[] = [];
  try {
    const { readdir } = await import('node:fs/promises');
    const cmds = await readdir(path.join(rootDir, 'cmd'), { withFileTypes: true });
    for (const entry of cmds) {
      if (!entry.isDirectory()) continue;
      const mainGo = path.join('cmd', entry.name, 'main.go');
      if (seen.has(mainGo)) continue;
      if (await fileExists(path.join(rootDir, mainGo))) {
        results.push({
          relativePath: mainGo,
          description: `command: ${entry.name}`,
          type: 'cli',
        });
        seen.add(mainGo);
      }
    }
  } catch { /* no cmd/ dir */ }
  return results;
}

export async function detectEntryPoints(
  rootDir: string,
  ecosystem: string,
): Promise<EntryPoint[]> {
  const seen = new Set<string>();
  const entries: EntryPoint[] = [];

  if (ecosystem === 'Node.js') {
    entries.push(...(await fromPackageJsonBin(rootDir)));
    for (const e of entries) seen.add(e.relativePath);
    entries.push(...(await scanCandidates(rootDir, NODE_CANDIDATES, seen)));
  } else if (ecosystem === 'Go') {
    entries.push(...(await scanGoCmdDir(rootDir, seen)));
    entries.push(...(await scanCandidates(rootDir, GO_CANDIDATES, seen)));
  } else if (ecosystem === 'Rust') {
    entries.push(...(await scanCandidates(rootDir, RUST_CANDIDATES, seen)));
  } else if (ecosystem === 'Python') {
    entries.push(...(await scanCandidates(rootDir, PYTHON_CANDIDATES, seen)));
  } else if (ecosystem === 'C++' || ecosystem === 'C') {
    entries.push(...(await scanCandidates(rootDir, CPP_CANDIDATES, seen)));
  }

  // Always add shared infrastructure entries (Docker, Makefile)
  entries.push(...(await scanCandidates(rootDir, SHARED_CANDIDATES, seen)));

  return entries.slice(0, 8);
}
