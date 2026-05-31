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

// Maps filename keyword → plain English description fragment.
// Used to turn "securityScanner.ts" into "security scanner" etc.
const KEYWORD_DESC: Record<string, string> = {
  handler: 'request handler',   handlers: 'request handlers',
  router: 'route definitions',  routes: 'route definitions',  routing: 'routing',
  controller: 'controller',     controllers: 'controllers',
  service: 'service layer',     services: 'service layer',
  middleware: 'HTTP middleware',
  auth: 'authentication',       authentication: 'authentication',
  authorization: 'authorization',
  config: 'configuration',      settings: 'settings',
  db: 'database client',        database: 'database layer',   store: 'data store',
  model: 'data model',          models: 'data models',
  schema: 'schema',             schemas: 'schemas',
  types: 'type definitions',    interfaces: 'interfaces',
  client: 'HTTP client',        server: 'server setup',
  api: 'API layer',
  util: 'utilities',            utils: 'utilities',
  helper: 'helpers',            helpers: 'helpers',
  scanner: 'file scanner',       parser: 'parser',
  analyzer: 'analysis orchestrator', orchestrator: 'orchestrator',
  cmd: 'command',               command: 'command',           commands: 'commands',
  cli: 'CLI entry',
  deployer: 'deployer',         deploy: 'deployment',
  test: 'test suite',           spec: 'test spec',
  bench: 'benchmark',           benchmark: 'benchmark',
  query: 'query builder',       queries: 'query builder',
  seed: 'data seed',            migration: 'migration',       migrations: 'migrations',
  // HTTP object extensions
  application: 'app bootstrap', request: 'request object',   response: 'response object',
  view: 'view/template layer',  views: 'view layer',
  // Python/Flask specific
  blueprint: 'route blueprint', blueprints: 'route blueprints',
  globals: 'global request context', session: 'session management', sessions: 'session management',
  // Detector/renderer module names (so codeglance self-describes well)
  entrypoints: 'entry point finder',
  starthere: 'start-here file ranker',
  forai: 'LLM context brief',
  terminal: 'terminal output renderer',
  git: 'git metadata',
  languages: 'language breakdown',
  scripts: 'command extractor',
  // General utilities
  errors: 'error types',        error: 'error handling',
  debug: 'debug utilities',     logging: 'logging setup',
  fs: 'filesystem helpers',     mode: 'runtime mode',
  url: 'URL parsing',           uri: 'URI handling',
  path: 'path utilities',       io: 'I/O helpers',
  plugin: 'plugin system',      plugins: 'plugin system',
  hook: 'lifecycle hooks',      hooks: 'lifecycle hooks',
  event: 'event system',        events: 'event system',
  cache: 'caching layer',       queue: 'task queue',
  worker: 'background worker',  job: 'background job',        jobs: 'background jobs',
  // Rendering
  markdown: 'Markdown renderer', template: 'template engine',  render: 'renderer',
  // Platform integrations — filename named after a service
  github: 'GitHub integration',  gitlab: 'GitLab integration',
  bitbucket: 'Bitbucket integration',
  slack: 'Slack integration',    stripe: 'Stripe integration',
  aws: 'AWS integration',        gcp: 'GCP integration',       azure: 'Azure integration',
};

// Generic names that need directory context to be meaningful
const GENERIC_NAMES = new Set(['main', 'index', 'app', 'init', 'mod', 'lib', 'core']);

function deriveReason(relativePath: string, parts: string[]): string {
  const filename = parts[parts.length - 1] ?? '';
  const dirName = parts.length > 1 ? parts[parts.length - 2] : '';
  const nameWithoutExt = path.basename(filename, path.extname(filename));

  // Split camelCase, PascalCase, snake_case, kebab-case into words
  const nameWords = nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase → camel Case
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);

  const isGenericName = nameWords.length === 1 && GENERIC_NAMES.has(nameWords[0] ?? '');

  // For generic names (main.go, index.ts), use directory as context
  if (isGenericName && dirName && !IMPORTANT_DIRS.has(dirName)) {
    return `${dirName} entry`;
  }

  // Look for keyword matches in name words
  for (const word of nameWords) {
    const desc = KEYWORD_DESC[word];
    if (desc) {
      const prefix = nameWords.filter((w) => w !== word && w.length > 2).join(' ');
      return prefix ? `${prefix} ${desc}` : desc;
    }
  }

  // If in a meaningful directory, suffix with it
  if (dirName && !IMPORTANT_DIRS.has(dirName) && dirName !== '.' && dirName.length < 20) {
    return `${nameWords.join(' ')} (${dirName}/)`;
  }

  // Last resort: just the words
  return nameWords.join(' ') || path.dirname(relativePath);
}

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

  // Refine generic reasons ("main entry") with directory context when meaningful
  if (reason === 'main entry' || reason === 'application entry') {
    const immediateDir = parts[parts.length - 2] ?? '';
    if (immediateDir && !IMPORTANT_DIRS.has(immediateDir) && immediateDir !== '.') {
      reason = `${immediateDir} entry`;
    }
  }

  // Directory bonus
  if (IMPORTANT_DIRS.has(parts[0] ?? '')) score += 20;
  if (IMPORTANT_DIRS.has(parts[1] ?? '')) score += 10;

  // Goldilocks size: 50–500 lines is readable and likely important
  if (file.lines >= 50 && file.lines <= 500) score += 25;
  else if (file.lines > 500 && file.lines <= 1000) score += 10;

  // If no specific reason, derive one from filename and directory context
  if (!reason) {
    reason = deriveReason(rel, parts);
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
