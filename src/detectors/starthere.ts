import path from 'node:path';
import type { ScannedFile } from '../scanner.js';

export interface StartHereFile {
  relativePath: string;
  reason: string;
  lines: number;
}

// Canonical file name patterns that suggest architectural importance.
// More specific patterns score higher.
const HIGH_VALUE_PATTERNS: Array<[RegExp, string, number]> = [
  // Entry / root
  [/^(index|main|app|server|mod)\.[jt]sx?$/, 'main entry', 100],
  [/^(router|routes|routing)\.[jt]sx?$/, 'route definitions', 95],
  [/^(api|handler|handlers)\.[jt]sx?$/, 'API handlers', 90],
  // Core domain
  [/^(schema|schemas|model|models|types|interfaces)\.[jt]sx?$/, 'type definitions', 85],
  [/^(auth|authentication|authorization)\.[jt]sx?$/, 'auth logic', 85],
  [/^(db|database|prisma|drizzle)\.[jt]sx?$/, 'database client', 80],
  [/^(config|settings|env)\.[jt]sx?$/, 'configuration', 75],
  // Core patterns in any extension
  [/^main\.(go|py|rs|java|kt|swift|c|cpp)$/, 'main entry', 100],
  [/^(app|server|api)\.(go|py|rs|java|kt|swift)$/, 'application entry', 90],
  [/^(router|routes|handler)\.(go|py|rs|java|kt)$/, 'route handler', 85],
  [/^(model|schema|types)\.(go|py|rs|java|kt)$/, 'data model', 80],
  // Special files
  [/^(schema\.prisma|schema\.graphql)$/, 'data schema', 90],
  [/^(Cargo\.toml|go\.mod|package\.json|pyproject\.toml)$/, 'project manifest', 70],
];

// Directories that indicate a file is likely important
const IMPORTANT_DIRS = new Set([
  'src', 'lib', 'app', 'api', 'server', 'core', 'internal',
  'pkg', 'cmd', 'handler', 'handlers', 'router', 'routes',
  'models', 'schema', 'schemas', 'domain', 'service', 'services',
]);

// Directories that indicate a file is less important for "where to start"
const LOWER_VALUE_DIRS = new Set([
  'test', 'tests', '__tests__', 'spec', 'specs', 'e2e',
  'fixtures', 'mocks', 'stubs', '__mocks__',
  'scripts', 'tools', 'hack', 'vendor',
  'examples', 'example', 'demo', 'samples',
  'migrations', 'seeds',
  'assets', 'public', 'static', 'dist', 'build',
  '.github', 'docs', 'doc',
  'node_modules',
]);

// Suffixes that suggest generated or less-useful files
const GENERATED_PATTERNS = [
  /\.gen\.[jt]s$/,
  /\.generated\.[jt]s$/,
  /\.d\.ts$/,
  /\.min\.[jt]s$/,
  /\.stories\.[jt]sx?$/,
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /_test\.(go|py|rs)$/,
  /test_.*\.(py)$/,
];

function scoreFile(file: ScannedFile): { score: number; reason: string } | null {
  const rel = file.relativePath;
  const basename = path.basename(rel);
  const parts = rel.split(path.sep);
  const depth = parts.length - 1; // 0 = root file

  // Skip generated, test, config-only files
  if (GENERATED_PATTERNS.some((p) => p.test(basename))) return null;
  if (LOWER_VALUE_DIRS.has(parts[0] ?? '')) return null;
  if (LOWER_VALUE_DIRS.has(parts[1] ?? '')) return null;

  // Must have a detected language to count as "source"
  if (!file.language) return null;
  if (!file.lines) return null;

  // Skip markup/documentation files — they're worth reading but aren't "source code"
  const SKIP_LANGUAGES = new Set(['Markdown', 'reStructuredText', 'YAML', 'TOML', 'JSON', 'XML']);
  if (SKIP_LANGUAGES.has(file.language)) return null;

  // Skip tiny files (likely stubs/re-exports) and huge ones (likely generated)
  if (file.lines < 15) return null;
  if (file.lines > 2000) return null;

  let score = 0;
  let reason = '';

  // Depth bonus: files closer to root are more likely to be entry points
  score += Math.max(0, 60 - depth * 12);

  // Check basename against high-value patterns
  for (const [pattern, desc, points] of HIGH_VALUE_PATTERNS) {
    if (pattern.test(basename)) {
      score += points;
      reason = desc;
      break;
    }
  }

  // Directory bonus
  if (IMPORTANT_DIRS.has(parts[0] ?? '')) score += 20;
  if (IMPORTANT_DIRS.has(parts[1] ?? '')) score += 10;

  // Goldilocks size: 50–500 lines is readable and likely important
  if (file.lines >= 50 && file.lines <= 500) score += 25;
  else if (file.lines > 500 && file.lines <= 1000) score += 10;

  // If no specific reason, derive one from directory name
  if (!reason) {
    const dir = parts[parts.length - 2] ?? '';
    const grandDir = parts[parts.length - 3] ?? '';
    if (IMPORTANT_DIRS.has(dir)) {
      // Make directory-based reasons read naturally
      const singular = dir.endsWith('s') && dir.length > 3 ? dir.slice(0, -1) : dir;
      reason = `${singular} module`;
    } else if (IMPORTANT_DIRS.has(grandDir)) {
      reason = `${grandDir}/${dir} module`;
    } else {
      reason = path.dirname(rel) === '.' ? 'root-level source' : `in ${path.dirname(rel)}/`;
    }
  }

  if (score <= 0) return null;
  return { score, reason };
}

export function rankStartHereFiles(
  files: ScannedFile[],
  limit = 8,
): StartHereFile[] {
  const scored: Array<{ file: ScannedFile; score: number; reason: string }> = [];

  for (const file of files) {
    const result = scoreFile(file);
    if (result) scored.push({ file, score: result.score, reason: result.reason });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ file, reason }) => ({
    relativePath: file.relativePath,
    reason,
    lines: file.lines ?? 0,
  }));
}
