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
  [['internal/server', 'pkg/server', 'server/server.go'], 'server package', 'server'],
  [['internal/api', 'pkg/api', 'api/api.go'], 'API handler', 'server'],
  [['internal/handler', 'pkg/handler'], 'HTTP handlers', 'server'],
];

const RUST_CANDIDATES: Array<[string[], string, EntryPoint['type']]> = [
  [['src/main.rs'], 'binary entry', 'main'],
  [['src/lib.rs'], 'library root', 'main'],
  [['src/bin'], 'additional binaries', 'cli'],
];

const PYTHON_CANDIDATES: Array<[string[], string, EntryPoint['type']]> = [
  [['main.py'], 'main entry', 'main'],
  [['app.py'], 'app entry', 'main'],
  [['manage.py'], 'Django management CLI', 'cli'],
  [['src/main.py', 'src/__main__.py', '__main__.py'], 'module entry', 'main'],
  [['api/main.py', 'app/main.py'], 'API entry', 'server'],
];

const SHARED_CANDIDATES: Array<[string[], string, EntryPoint['type']]> = [
  [['Dockerfile'], 'container definition', 'infra'],
  [['docker-compose.yml', 'docker-compose.yaml'], 'compose services', 'infra'],
  [['Makefile', 'makefile'], 'build targets', 'config'],
  [['justfile', 'Justfile'], 'task definitions', 'config'],
];

async function fromPackageJsonBin(rootDir: string): Promise<EntryPoint[]> {
  try {
    const content = await readFile(path.join(rootDir, 'package.json'), 'utf8');
    const pkg = JSON.parse(content) as { main?: string; bin?: string | Record<string, string> };
    const entries: EntryPoint[] = [];
    if (pkg.main && (await fileExists(path.join(rootDir, pkg.main)))) {
      entries.push({ relativePath: pkg.main, description: 'main (package.json)', type: 'main' });
    }
    if (pkg.bin) {
      if (typeof pkg.bin === 'string' && (await fileExists(path.join(rootDir, pkg.bin)))) {
        entries.push({ relativePath: pkg.bin, description: 'CLI binary', type: 'cli' });
      } else if (typeof pkg.bin === 'object') {
        for (const [name, p] of Object.entries(pkg.bin)) {
          if (await fileExists(path.join(rootDir, p))) {
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
  }

  // Always add shared infrastructure entries (Docker, Makefile)
  entries.push(...(await scanCandidates(rootDir, SHARED_CANDIDATES, seen)));

  return entries.slice(0, 8);
}
