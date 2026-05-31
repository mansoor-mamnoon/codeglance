import { open, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import ignore, { type Ignore } from 'ignore';

// Directories that are never source code — always skip regardless of .gitignore
const SKIP_DIRS = new Set([
  '.git', '.svn', '.hg', '.bzr',
  'node_modules', 'vendor', '.vendor',
  'dist', 'build', 'out', 'target', '.turbo',
  '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache',
  '.next', '.nuxt', '.svelte-kit', '.vercel', '.output',
  'coverage', '.nyc_output', '.terraform',
  'tox', '.tox', 'venv', '.venv', '.eggs',
  '.gradle', '.idea',
]);

// Lockfiles and generated files to skip
const SKIP_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
  'Cargo.lock', 'go.sum', 'Gemfile.lock', 'composer.lock',
  'poetry.lock', 'uv.lock', 'pipfile.lock',
]);

// 1 MB — skip generated/minified blobs
const MAX_FILE_BYTES = 1_000_000;

// Hard cap to keep analysis fast on massive repos
export const MAX_FILES_SCANNED = 25_000;

export interface ScannedFile {
  /** Absolute path */
  path: string;
  /** Path relative to rootDir */
  relativePath: string;
  /** Detected language (null if unknown/binary) */
  language: string | null;
  /** Line count (null for binary/skipped) */
  lines: number | null;
  /** File size in bytes */
  bytes: number;
}

async function loadGitignore(dir: string): Promise<Ignore> {
  const ig = ignore();
  try {
    const content = await readFile(path.join(dir, '.gitignore'), 'utf8');
    ig.add(content);
  } catch {
    // No .gitignore is fine
  }
  return ig;
}

async function isBinaryBuffer(filePath: string): Promise<boolean> {
  let fd: Awaited<ReturnType<typeof open>> | null = null;
  try {
    fd = await open(filePath, 'r');
    const buf = Buffer.alloc(4096);
    const { bytesRead } = await fd.read(buf, 0, 4096, 0);
    for (let i = 0; i < bytesRead; i++) {
      if (buf[i] === 0) return true;
    }
    return false;
  } catch {
    return true;
  } finally {
    await fd?.close();
  }
}

async function countLines(filePath: string, bytes: number): Promise<number | null> {
  if (bytes === 0) return 0;
  if (bytes > MAX_FILE_BYTES) return null;
  if (await isBinaryBuffer(filePath)) return null;

  const buf = await readFile(filePath);
  let count = 1;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 10) count++; // '\n'
  }
  return count;
}

async function walk(
  dir: string,
  rootDir: string,
  ig: Ignore,
  detectLanguage: (filePath: string) => string | null,
  results: ScannedFile[],
  count: { n: number },
): Promise<void> {
  if (count.n >= MAX_FILES_SCANNED) return;

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (count.n >= MAX_FILES_SCANNED) break;
    if (entry.isSymbolicLink()) continue;

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(rootDir, fullPath);

    if (ig.ignores(relativePath)) continue;

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      // Skip hidden dirs except .github/.circleci (they contain important config)
      if (
        entry.name.startsWith('.') &&
        entry.name !== '.github' &&
        entry.name !== '.circleci'
      ) continue;

      await walk(fullPath, rootDir, ig, detectLanguage, results, count);
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue;

      const language = detectLanguage(fullPath);

      let bytes = 0;
      let lines: number | null = null;
      try {
        const info = await stat(fullPath);
        bytes = info.size;
        if (language !== null) {
          lines = await countLines(fullPath, bytes);
        }
      } catch {
        continue;
      }

      results.push({ path: fullPath, relativePath, language, lines, bytes });
      count.n++;
    }
  }
}

export async function scanDirectory(
  rootDir: string,
  detectLanguage: (filePath: string) => string | null,
): Promise<{ files: ScannedFile[]; capped: boolean }> {
  const ig = await loadGitignore(rootDir);
  const results: ScannedFile[] = [];
  const count = { n: 0 };

  await walk(rootDir, rootDir, ig, detectLanguage, results, count);

  return { files: results, capped: count.n >= MAX_FILES_SCANNED };
}
