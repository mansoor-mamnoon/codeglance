import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type FrameworkCategory =
  | 'web_framework'
  | 'ui_library'
  | 'orm'
  | 'auth'
  | 'api'
  | 'testing'
  | 'runtime'
  | 'build_tool'
  | 'linting'
  | 'database'
  | 'ai_ml'
  | 'cli'
  | 'other';

export interface DetectedFramework {
  name: string;
  version: string | null;
  category: FrameworkCategory;
  ecosystem: string;
}

export interface FrameworkReport {
  /** One-line human description: "Next.js 14 app with Prisma and Tailwind CSS" */
  summary: string;
  primary: DetectedFramework[];
  secondary: DetectedFramework[];
  all: DetectedFramework[];
  ecosystem: string;
  /** e.g. "Node.js ≥18", "Go 1.21", "Python 3.11" */
  runtime: string | null;
}

// ---------------------------------------------------------------------------
// Ecosystem-specific knowledge maps
// ---------------------------------------------------------------------------

interface FrameworkDef {
  name: string;
  category: FrameworkCategory;
  /** Package name or go module path or cargo crate name */
  keys: string[];
}

const NODE_FRAMEWORKS: FrameworkDef[] = [
  // Web frameworks
  { name: 'Next.js',      category: 'web_framework', keys: ['next'] },
  { name: 'Remix',        category: 'web_framework', keys: ['@remix-run/node', '@remix-run/react'] },
  { name: 'SvelteKit',    category: 'web_framework', keys: ['@sveltejs/kit'] },
  { name: 'Astro',        category: 'web_framework', keys: ['astro'] },
  { name: 'Nuxt',         category: 'web_framework', keys: ['nuxt'] },
  { name: 'NestJS',       category: 'web_framework', keys: ['@nestjs/core'] },
  { name: 'Fastify',      category: 'web_framework', keys: ['fastify'] },
  { name: 'Express',      category: 'web_framework', keys: ['express'] },
  { name: 'Hono',         category: 'web_framework', keys: ['hono'] },
  { name: 'Koa',          category: 'web_framework', keys: ['koa'] },
  { name: 'Elysia',       category: 'web_framework', keys: ['elysia'] },
  // UI libraries
  { name: 'React',        category: 'ui_library',    keys: ['react'] },
  { name: 'Vue',          category: 'ui_library',    keys: ['vue'] },
  { name: 'Angular',      category: 'ui_library',    keys: ['@angular/core'] },
  { name: 'Svelte',       category: 'ui_library',    keys: ['svelte'] },
  { name: 'Solid',        category: 'ui_library',    keys: ['solid-js'] },
  { name: 'Preact',       category: 'ui_library',    keys: ['preact'] },
  // UI component libraries
  { name: 'Tailwind CSS', category: 'ui_library',    keys: ['tailwindcss'] },
  { name: 'shadcn/ui',    category: 'ui_library',    keys: ['@shadcn/ui', 'shadcn-ui'] },
  { name: 'Material UI',  category: 'ui_library',    keys: ['@mui/material'] },
  { name: 'Chakra UI',    category: 'ui_library',    keys: ['@chakra-ui/react'] },
  { name: 'Radix UI',     category: 'ui_library',    keys: ['@radix-ui/react-dialog', '@radix-ui/themes'] },
  { name: 'Ant Design',   category: 'ui_library',    keys: ['antd'] },
  // ORM / database
  { name: 'Prisma',       category: 'orm',           keys: ['@prisma/client', 'prisma'] },
  { name: 'Drizzle',      category: 'orm',           keys: ['drizzle-orm'] },
  { name: 'TypeORM',      category: 'orm',           keys: ['typeorm'] },
  { name: 'Sequelize',    category: 'orm',           keys: ['sequelize'] },
  { name: 'Mongoose',     category: 'orm',           keys: ['mongoose'] },
  { name: 'Knex',         category: 'orm',           keys: ['knex'] },
  { name: 'Kysely',       category: 'orm',           keys: ['kysely'] },
  // Auth
  { name: 'Auth.js',      category: 'auth',          keys: ['next-auth', '@auth/core'] },
  { name: 'Lucia',        category: 'auth',          keys: ['lucia'] },
  { name: 'Clerk',        category: 'auth',          keys: ['@clerk/nextjs', '@clerk/clerk-sdk-node'] },
  { name: 'Passport',     category: 'auth',          keys: ['passport'] },
  // API
  { name: 'tRPC',         category: 'api',           keys: ['@trpc/server', '@trpc/client'] },
  { name: 'GraphQL',      category: 'api',           keys: ['graphql', '@apollo/server', 'apollo-server'] },
  { name: 'gRPC',         category: 'api',           keys: ['@grpc/grpc-js'] },
  // Testing
  { name: 'Vitest',       category: 'testing',       keys: ['vitest'] },
  { name: 'Jest',         category: 'testing',       keys: ['jest', '@jest/core'] },
  { name: 'Playwright',   category: 'testing',       keys: ['@playwright/test', 'playwright'] },
  { name: 'Cypress',      category: 'testing',       keys: ['cypress'] },
  { name: 'Testing Library', category: 'testing',    keys: ['@testing-library/react', '@testing-library/vue'] },
  // Build tools
  { name: 'Vite',         category: 'build_tool',    keys: ['vite'] },
  { name: 'Webpack',      category: 'build_tool',    keys: ['webpack'] },
  { name: 'Rollup',       category: 'build_tool',    keys: ['rollup'] },
  { name: 'esbuild',      category: 'build_tool',    keys: ['esbuild'] },
  { name: 'Turbopack',    category: 'build_tool',    keys: ['turbopack'] },
  { name: 'Parcel',       category: 'build_tool',    keys: ['parcel'] },
  { name: 'tsup',         category: 'build_tool',    keys: ['tsup'] },
  // Runtimes
  { name: 'Electron',     category: 'runtime',       keys: ['electron'] },
  { name: 'Tauri',        category: 'runtime',       keys: ['@tauri-apps/cli', '@tauri-apps/api'] },
  // Linting
  { name: 'ESLint',       category: 'linting',       keys: ['eslint'] },
  { name: 'Prettier',     category: 'linting',       keys: ['prettier'] },
  { name: 'Biome',        category: 'linting',       keys: ['@biomejs/biome'] },
  // AI
  { name: 'OpenAI SDK',   category: 'ai_ml',         keys: ['openai'] },
  { name: 'Anthropic SDK',category: 'ai_ml',         keys: ['@anthropic-ai/sdk'] },
  { name: 'Vercel AI SDK',category: 'ai_ml',         keys: ['ai', '@ai-sdk/openai'] },
  { name: 'LangChain.js', category: 'ai_ml',         keys: ['@langchain/core', 'langchain'] },
  // CLI
  { name: 'Commander',    category: 'cli',           keys: ['commander'] },
  { name: 'Yargs',        category: 'cli',           keys: ['yargs'] },
  { name: 'Oclif',        category: 'cli',           keys: ['@oclif/core'] },
  { name: 'Ink',          category: 'cli',           keys: ['ink'] },
  { name: 'Inquirer',     category: 'cli',           keys: ['inquirer', '@inquirer/prompts'] },
];

const GO_FRAMEWORKS: FrameworkDef[] = [
  { name: 'Gin',          category: 'web_framework', keys: ['github.com/gin-gonic/gin'] },
  { name: 'Echo',         category: 'web_framework', keys: ['github.com/labstack/echo'] },
  { name: 'Fiber',        category: 'web_framework', keys: ['github.com/gofiber/fiber'] },
  { name: 'Chi',          category: 'web_framework', keys: ['github.com/go-chi/chi'] },
  { name: 'Gorilla Mux',  category: 'web_framework', keys: ['github.com/gorilla/mux'] },
  { name: 'Gorilla WebSocket', category: 'other',    keys: ['github.com/gorilla/websocket'] },
  { name: 'gRPC',         category: 'api',           keys: ['google.golang.org/grpc'] },
  { name: 'Connect',      category: 'api',           keys: ['connectrpc.com/connect'] },
  { name: 'GORM',         category: 'orm',           keys: ['gorm.io/gorm'] },
  { name: 'sqlx',         category: 'orm',           keys: ['github.com/jmoiron/sqlx'] },
  { name: 'Ent',          category: 'orm',           keys: ['entgo.io/ent'] },
  { name: 'pgx',          category: 'database',      keys: ['github.com/jackc/pgx'] },
  { name: 'MongoDB',      category: 'database',      keys: ['go.mongodb.org/mongo-driver'] },
  { name: 'Redis',        category: 'database',      keys: ['github.com/redis/go-redis', 'github.com/go-redis/redis'] },
  { name: 'Cobra',        category: 'cli',           keys: ['github.com/spf13/cobra'] },
  { name: 'Viper',        category: 'other',         keys: ['github.com/spf13/viper'] },
  { name: 'Zap',          category: 'other',         keys: ['go.uber.org/zap'] },
  { name: 'Zerolog',      category: 'other',         keys: ['github.com/rs/zerolog'] },
  { name: 'OpenAI SDK',   category: 'ai_ml',         keys: ['github.com/openai/openai-go', 'github.com/sashabaranov/go-openai'] },
  { name: 'Anthropic SDK',category: 'ai_ml',         keys: ['github.com/anthropics/anthropic-sdk-go'] },
];

const RUST_FRAMEWORKS: FrameworkDef[] = [
  { name: 'Axum',         category: 'web_framework', keys: ['axum'] },
  { name: 'Actix-web',    category: 'web_framework', keys: ['actix-web'] },
  { name: 'Rocket',       category: 'web_framework', keys: ['rocket'] },
  { name: 'Warp',         category: 'web_framework', keys: ['warp'] },
  { name: 'Poem',         category: 'web_framework', keys: ['poem'] },
  { name: 'Tokio',        category: 'runtime',       keys: ['tokio'] },
  { name: 'async-std',    category: 'runtime',       keys: ['async-std'] },
  { name: 'Serde',        category: 'other',         keys: ['serde'] },
  { name: 'SQLx',         category: 'orm',           keys: ['sqlx'] },
  { name: 'Diesel',       category: 'orm',           keys: ['diesel'] },
  { name: 'SeaORM',       category: 'orm',           keys: ['sea-orm'] },
  { name: 'Clap',         category: 'cli',           keys: ['clap'] },
  { name: 'Tonic',        category: 'api',           keys: ['tonic'] },
  { name: 'Reqwest',      category: 'other',         keys: ['reqwest'] },
  { name: 'Tracing',      category: 'other',         keys: ['tracing'] },
  { name: 'Anyhow',       category: 'other',         keys: ['anyhow'] },
  { name: 'Leptos',       category: 'ui_library',    keys: ['leptos'] },
  { name: 'Yew',          category: 'ui_library',    keys: ['yew'] },
  { name: 'Dioxus',       category: 'ui_library',    keys: ['dioxus'] },
  { name: 'Bevy',         category: 'other',         keys: ['bevy'] },
  { name: 'Tauri',        category: 'runtime',       keys: ['tauri'] },
];

const PYTHON_FRAMEWORKS: FrameworkDef[] = [
  { name: 'FastAPI',      category: 'web_framework', keys: ['fastapi'] },
  { name: 'Django',       category: 'web_framework', keys: ['django', 'Django'] },
  { name: 'Flask',        category: 'web_framework', keys: ['flask', 'Flask'] },
  { name: 'Starlette',    category: 'web_framework', keys: ['starlette'] },
  { name: 'aiohttp',      category: 'web_framework', keys: ['aiohttp'] },
  { name: 'Tornado',      category: 'web_framework', keys: ['tornado'] },
  { name: 'Litestar',     category: 'web_framework', keys: ['litestar'] },
  { name: 'SQLAlchemy',   category: 'orm',           keys: ['sqlalchemy', 'SQLAlchemy'] },
  { name: 'Tortoise ORM', category: 'orm',           keys: ['tortoise-orm'] },
  { name: 'Pony ORM',     category: 'orm',           keys: ['pony'] },
  { name: 'Pydantic',     category: 'other',         keys: ['pydantic'] },
  { name: 'Alembic',      category: 'orm',           keys: ['alembic'] },
  { name: 'Celery',       category: 'other',         keys: ['celery'] },
  { name: 'Pytest',       category: 'testing',       keys: ['pytest'] },
  { name: 'Black',        category: 'linting',       keys: ['black'] },
  { name: 'Ruff',         category: 'linting',       keys: ['ruff'] },
  { name: 'Mypy',         category: 'linting',       keys: ['mypy'] },
  { name: 'PyTorch',      category: 'ai_ml',         keys: ['torch'] },
  { name: 'TensorFlow',   category: 'ai_ml',         keys: ['tensorflow'] },
  { name: 'LangChain',    category: 'ai_ml',         keys: ['langchain'] },
  { name: 'OpenAI SDK',   category: 'ai_ml',         keys: ['openai'] },
  { name: 'Anthropic SDK',category: 'ai_ml',         keys: ['anthropic'] },
  { name: 'NumPy',        category: 'ai_ml',         keys: ['numpy'] },
  { name: 'Pandas',       category: 'ai_ml',         keys: ['pandas'] },
  { name: 'Click',        category: 'cli',           keys: ['click'] },
  { name: 'Typer',        category: 'cli',           keys: ['typer'] },
  { name: 'Rich',         category: 'cli',           keys: ['rich'] },
];

// ---------------------------------------------------------------------------
// Manifest parsers
// ---------------------------------------------------------------------------

function cleanVersion(raw: string): string {
  const cleaned = raw.replace(/^[\^~>=<*\s]/g, '').split(/\s/)[0] ?? raw;
  if (!cleaned || cleaned === '*' || cleaned === 'latest') return '';
  const parts = cleaned.split('.');
  const major = parts[0] ?? '';
  // Pre-1.0 packages: show major.minor so "Axum 0.7" doesn't truncate to just "0"
  if (major === '0' && parts[1]) return `${major}.${parts[1]}`;
  return major;
}

async function fromPackageJson(rootDir: string): Promise<{
  frameworks: DetectedFramework[];
  runtime: string | null;
  ecosystem: string;
} | null> {
  try {
    const content = await readFile(path.join(rootDir, 'package.json'), 'utf8');
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      engines?: Record<string, string>;
    };

    const allDeps: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };

    const frameworks: DetectedFramework[] = [];
    for (const def of NODE_FRAMEWORKS) {
      for (const key of def.keys) {
        if (allDeps[key] !== undefined) {
          frameworks.push({
            name: def.name,
            version: cleanVersion(allDeps[key] ?? ''),
            category: def.category,
            ecosystem: 'Node.js',
          });
          break;
        }
      }
    }

    // Detect TypeScript separately since it's special
    if (allDeps['typescript'] && !frameworks.some((f) => f.name === 'TypeScript')) {
      frameworks.push({
        name: 'TypeScript',
        version: cleanVersion(allDeps['typescript']),
        category: 'build_tool',
        ecosystem: 'Node.js',
      });
    }

    // Detect package manager from lockfiles (not framework, but useful context)
    const runtime = pkg.engines?.node ? `Node.js ${pkg.engines.node}` : null;

    return { frameworks, runtime, ecosystem: 'Node.js' };
  } catch {
    return null;
  }
}

async function fromGoMod(rootDir: string): Promise<{
  frameworks: DetectedFramework[];
  runtime: string | null;
  ecosystem: string;
} | null> {
  try {
    const content = await readFile(path.join(rootDir, 'go.mod'), 'utf8');
    const frameworks: DetectedFramework[] = [];

    // Extract all require entries
    const requireBlocks = content.matchAll(
      /(?:require\s+(\S+)\s+v[\d.]+)|(?:require\s*\(([^)]+)\))/gs,
    );

    const deps: Record<string, string> = {};

    for (const block of requireBlocks) {
      if (block[1]) {
        // single-line require
        deps[block[1]] = '';
      } else if (block[2]) {
        // require block
        for (const line of block[2].split('\n')) {
          const m = line.trim().match(/^(\S+)\s+v([\d.]+)/);
          if (m && m[1] && !m[1].startsWith('//')) deps[m[1]] = m[2] ?? '';
        }
      }
    }

    for (const def of GO_FRAMEWORKS) {
      for (const key of def.keys) {
        const matched = Object.keys(deps).find((d) => d === key || d.startsWith(key + '/'));
        if (matched !== undefined) {
          frameworks.push({
            name: def.name,
            version: deps[matched] ?? null,
            category: def.category,
            ecosystem: 'Go',
          });
          break;
        }
      }
    }

    const goVersion = content.match(/^go\s+([\d.]+)/m)?.[1] ?? null;
    return { frameworks, runtime: goVersion ? `Go ${goVersion}` : null, ecosystem: 'Go' };
  } catch {
    return null;
  }
}

async function fromCargoToml(rootDir: string): Promise<{
  frameworks: DetectedFramework[];
  runtime: string | null;
  ecosystem: string;
} | null> {
  try {
    const content = await readFile(path.join(rootDir, 'Cargo.toml'), 'utf8');
    const deps: Record<string, string> = {};

    let inDeps = false;
    let inDevDeps = false;
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (t === '[dependencies]' || t === '[workspace.dependencies]') { inDeps = true; inDevDeps = false; continue; }
      if (t === '[dev-dependencies]') { inDevDeps = true; inDeps = false; continue; }
      if (t.startsWith('[')) { inDeps = false; inDevDeps = false; continue; }
      if (inDeps || inDevDeps) {
        const m = t.match(/^([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]+)"|.*version\s*=\s*"([^"]+)")/);
        if (m && m[1]) deps[m[1]] = m[2] ?? m[3] ?? '';
      }
    }

    const frameworks: DetectedFramework[] = [];
    for (const def of RUST_FRAMEWORKS) {
      for (const key of def.keys) {
        if (deps[key] !== undefined) {
          frameworks.push({
            name: def.name,
            version: cleanVersion(deps[key] ?? ''),
            category: def.category,
            ecosystem: 'Rust',
          });
          break;
        }
      }
    }

    const rustEdition = content.match(/edition\s*=\s*"(\d+)"/)?.[1];
    return {
      frameworks,
      runtime: rustEdition ? `Rust (edition ${rustEdition})` : 'Rust',
      ecosystem: 'Rust',
    };
  } catch {
    return null;
  }
}

async function fromPythonManifests(rootDir: string): Promise<{
  frameworks: DetectedFramework[];
  runtime: string | null;
  ecosystem: string;
} | null> {
  // Try pyproject.toml first, then requirements.txt
  const deps: string[] = [];

  try {
    const content = await readFile(path.join(rootDir, 'pyproject.toml'), 'utf8');
    // [project] dependencies
    const depBlock = content.match(/\[project\][\s\S]*?dependencies\s*=\s*\[([\s\S]*?)\]/);
    if (depBlock) {
      for (const m of depBlock[1].matchAll(/"([a-zA-Z0-9_-]+)/g)) {
        if (m[1]) deps.push(m[1]);
      }
    }
    // [tool.poetry.dependencies]
    const poetryBlock = content.match(/\[tool\.poetry\.dependencies\]([\s\S]*?)(?=\[|$)/);
    if (poetryBlock) {
      for (const line of poetryBlock[1].split('\n')) {
        const m = line.match(/^([a-zA-Z0-9_-]+)\s*=/);
        if (m && m[1] && m[1] !== 'python') deps.push(m[1]);
      }
    }
  } catch { /* try requirements.txt */ }

  if (deps.length === 0) {
    try {
      const content = await readFile(path.join(rootDir, 'requirements.txt'), 'utf8');
      for (const line of content.split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#') || t.startsWith('-')) continue;
        const name = t.split(/[=<>!~;\s]/)[0];
        if (name) deps.push(name);
      }
    } catch { /* no manifest found */ }
  }

  if (deps.length === 0) return null;

  const depSet = new Set(deps.map((d) => d.toLowerCase()));
  const frameworks: DetectedFramework[] = [];

  for (const def of PYTHON_FRAMEWORKS) {
    for (const key of def.keys) {
      if (depSet.has(key.toLowerCase())) {
        frameworks.push({
          name: def.name,
          version: null,
          category: def.category,
          ecosystem: 'Python',
        });
        break;
      }
    }
  }

  // Try to detect Python version from pyproject.toml
  let runtime: string | null = null;
  try {
    const content = await readFile(path.join(rootDir, 'pyproject.toml'), 'utf8');
    const v = content.match(/requires-python\s*=\s*"([^"]+)"/)?.[1];
    if (v) runtime = `Python ${v}`;
  } catch { /* ok */ }

  return { frameworks, runtime, ecosystem: 'Python' };
}

// ---------------------------------------------------------------------------
// Summary generator
// ---------------------------------------------------------------------------

function buildSummary(
  frameworks: DetectedFramework[],
  ecosystem: string,
): string {
  const primary = frameworks.find(
    (f) => f.category === 'web_framework' || f.category === 'ui_library',
  );
  const orm = frameworks.find((f) => f.category === 'orm');
  const apiStyle = frameworks.find((f) => f.category === 'api');
  const aiPkg = frameworks.find((f) => f.category === 'ai_ml');
  const cli = frameworks.find((f) => f.category === 'cli');
  const runtime = frameworks.find((f) => f.category === 'runtime' && f.name !== 'Tokio');

  const extras: string[] = [];
  if (orm) extras.push(orm.name);
  if (apiStyle) extras.push(apiStyle.name);
  if (aiPkg) extras.push(aiPkg.name);

  const versionSuffix = (f: DetectedFramework) =>
    f.version && f.version !== 'latest' ? ` ${f.version}` : '';

  if (primary) {
    const base = `${primary.name}${versionSuffix(primary)}`;
    const suffix = extras.length > 0 ? ` with ${extras.join(', ')}` : '';
    return `${base}${suffix}`;
  }

  if (cli) {
    return `CLI tool (${ecosystem}) using ${cli.name}`;
  }

  if (runtime) {
    return `${runtime.name} application`;
  }

  if (aiPkg) {
    return `${ecosystem} service with ${aiPkg.name}`;
  }

  if (ecosystem === 'Terraform') {
    // runtime holds "AWS + GCP · 3 modules · 12 resources" — no need to repeat framework name
    return 'Terraform project';
  }

  if (ecosystem === 'C++' || ecosystem === 'C') {
    const extras = frameworks.map((f) => f.name).slice(0, 3);
    return extras.length > 0
      ? `C++ project with ${extras.join(', ')}`
      : 'C++ project (CMake)';
  }

  if (frameworks.length > 0) {
    return `${ecosystem} project — ${frameworks
      .slice(0, 3)
      .map((f) => f.name)
      .join(', ')}`;
  }

  return `${ecosystem} project`;
}

// ---------------------------------------------------------------------------
// Primary / secondary split
// ---------------------------------------------------------------------------

const PRIMARY_CATEGORIES: FrameworkCategory[] = ['web_framework', 'ui_library', 'runtime', 'ai_ml', 'cli'];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

async function fromCMake(rootDir: string): Promise<{
  frameworks: DetectedFramework[];
  runtime: string | null;
  ecosystem: string;
} | null> {
  const access = (await import('node:fs/promises')).access;
  try {
    await access(path.join(rootDir, 'CMakeLists.txt'));
  } catch {
    return null;
  }

  const content = await readFile(path.join(rootDir, 'CMakeLists.txt'), 'utf8');
  const frameworks: DetectedFramework[] = [];

  // Detect CMake-listed test/UI dependencies
  if (/googletest|GTest|gtest/i.test(content)) {
    frameworks.push({ name: 'GoogleTest', category: 'testing', version: null, ecosystem: 'C++' });
  }
  if (/Boost/i.test(content)) {
    frameworks.push({ name: 'Boost', category: 'other', version: null, ecosystem: 'C++' });
  }
  if (/Qt[0-9]?::/i.test(content) || /find_package\(Qt/i.test(content)) {
    frameworks.push({ name: 'Qt', category: 'ui_library', version: null, ecosystem: 'C++' });
  }
  if (/OpenCV/i.test(content)) {
    frameworks.push({ name: 'OpenCV', category: 'other', version: null, ecosystem: 'C++' });
  }
  if (/Catch2/i.test(content)) {
    frameworks.push({ name: 'Catch2', category: 'testing', version: null, ecosystem: 'C++' });
  }
  if (/spdlog/i.test(content)) {
    frameworks.push({ name: 'spdlog', category: 'other', version: null, ecosystem: 'C++' });
  }

  const cmakeMin = content.match(/cmake_minimum_required\s*\(\s*VERSION\s+([\d.]+)/i)?.[1] ?? null;
  const cxxStd = content.match(/CMAKE_CXX_STANDARD\s+(\d+)/)?.[1];
  const runtime = [
    cmakeMin ? `CMake ≥${cmakeMin}` : 'CMake',
    cxxStd ? `C++${cxxStd}` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return { frameworks, runtime, ecosystem: 'C++' };
}

// Maps Terraform provider source names to display names
const TERRAFORM_PROVIDERS: Record<string, string> = {
  aws: 'AWS', google: 'GCP', azurerm: 'Azure', azuread: 'Azure AD',
  kubernetes: 'Kubernetes', helm: 'Helm', digitalocean: 'DigitalOcean',
  cloudflare: 'Cloudflare', github: 'GitHub', datadog: 'Datadog',
  vault: 'Vault', consul: 'Consul', nomad: 'Nomad',
};

async function fromTerraform(rootDir: string): Promise<{
  frameworks: DetectedFramework[];
  runtime: string | null;
  ecosystem: string;
} | null> {
  const { readdir } = await import('node:fs/promises');
  let tfFiles: string[];
  try {
    const entries = await readdir(rootDir);
    tfFiles = entries.filter((e) => e.endsWith('.tf'));
  } catch {
    return null;
  }
  if (tfFiles.length === 0) return null;

  const providers = new Set<string>();
  let moduleCount = 0;
  let resourceCount = 0;

  for (const file of tfFiles) {
    try {
      const content = await readFile(path.join(rootDir, file), 'utf8');

      // provider "aws" { ... }
      for (const m of content.matchAll(/^provider\s+"([^"]+)"/gm)) {
        const mapped = m[1] ? (TERRAFORM_PROVIDERS[m[1].toLowerCase()] ?? m[1]) : null;
        if (mapped) providers.add(mapped);
      }
      // required_providers { aws = { source = "hashicorp/aws" } }
      for (const m of content.matchAll(/(\w+)\s*=\s*\{\s*\n?\s*source\s*=/gm)) {
        const key = m[1]?.toLowerCase();
        if (key && TERRAFORM_PROVIDERS[key]) providers.add(TERRAFORM_PROVIDERS[key]);
      }

      moduleCount   += (content.match(/^module\s+"/gm)   ?? []).length;
      resourceCount += (content.match(/^resource\s+"/gm) ?? []).length;
    } catch { /* skip unreadable files */ }
  }

  // Always return at least one framework entry so the summary pipeline runs
  const frameworks: DetectedFramework[] = [
    { name: 'Terraform', category: 'build_tool', version: null, ecosystem: 'Terraform' },
  ];

  const parts: string[] = [];
  if (providers.size > 0) parts.push([...providers].join(' + '));
  if (moduleCount   > 0) parts.push(`${moduleCount} module${moduleCount > 1 ? 's' : ''}`);
  if (resourceCount > 0) parts.push(`${resourceCount} resource${resourceCount > 1 ? 's' : ''}`);

  return {
    frameworks,
    runtime: parts.length > 0 ? parts.join('  ·  ') : null,
    ecosystem: 'Terraform',
  };
}

// Known Maven/Gradle dependency artifactIds → display name + category
const JAVA_DEPS: Array<[RegExp, string, FrameworkCategory]> = [
  [/spring-boot-starter-web/,       'Spring Boot',   'web_framework'],
  [/spring-boot-starter(?!-\w)/,    'Spring Boot',   'web_framework'],
  [/spring-webmvc/,                 'Spring MVC',    'web_framework'],
  [/quarkus-resteasy/,              'Quarkus',       'web_framework'],
  [/micronaut-http-server/,         'Micronaut',     'web_framework'],
  [/vertx-web/,                     'Vert.x',        'web_framework'],
  [/spring-boot-starter-data-jpa/,  'Spring Data JPA','orm'],
  [/hibernate-core/,                'Hibernate',     'orm'],
  [/mybatis/,                       'MyBatis',       'orm'],
  [/spring-boot-starter-security/,  'Spring Security','auth'],
  [/spring-boot-starter-test|junit-jupiter/, 'JUnit 5', 'testing'],
  [/mockito/,                       'Mockito',       'testing'],
  [/lombok/,                        'Lombok',        'other'],
];

async function javaFileExists(p: string): Promise<boolean> {
  try { await (await import('node:fs/promises')).access(p); return true; }
  catch { return false; }
}

async function fromJava(rootDir: string): Promise<{
  frameworks: DetectedFramework[];
  runtime: string | null;
  ecosystem: string;
} | null> {
  // Try pom.xml (Maven) first, then build.gradle (Gradle)
  const hasPom    = await javaFileExists(path.join(rootDir, 'pom.xml'));
  const hasGradle = await javaFileExists(path.join(rootDir, 'build.gradle')) ||
                    await javaFileExists(path.join(rootDir, 'build.gradle.kts'));
  if (!hasPom && !hasGradle) return null;

  const frameworks: DetectedFramework[] = [];
  const seen = new Set<string>();
  let javaVersion: string | null = null;
  let buildTool = hasPom ? 'Maven' : 'Gradle';

  if (hasPom) {
    try {
      const content = await readFile(path.join(rootDir, 'pom.xml'), 'utf8');
      const jv = content.match(/<java\.version>([\d.]+)<\/java\.version>/)?.[1];
      if (jv) javaVersion = jv;
      for (const [pattern, name, category] of JAVA_DEPS) {
        if (pattern.test(content) && !seen.has(name)) {
          frameworks.push({ name, category, version: null, ecosystem: 'Java' });
          seen.add(name);
        }
      }
    } catch { /* ok */ }
  }

  if (hasGradle) {
    const gradleFile = (await javaFileExists(path.join(rootDir, 'build.gradle.kts')))
      ? 'build.gradle.kts' : 'build.gradle';
    try {
      const content = await readFile(path.join(rootDir, gradleFile), 'utf8');
      const jv = content.match(/sourceCompatibility\s*=\s*['"]?(\d+)['"]?/)?.[1] ??
                 content.match(/JavaVersion\.VERSION_(\d+)/)?.[1];
      if (jv && !javaVersion) javaVersion = jv;
      for (const [pattern, name, category] of JAVA_DEPS) {
        if (pattern.test(content) && !seen.has(name)) {
          frameworks.push({ name, category, version: null, ecosystem: 'Java' });
          seen.add(name);
        }
      }
    } catch { /* ok */ }
  }

  // Always emit at least the build tool so the summary pipeline has something to work with
  if (!seen.has(buildTool)) {
    frameworks.push({ name: buildTool, category: 'build_tool', version: null, ecosystem: 'Java' });
  }

  const runtime = javaVersion ? `Java ${javaVersion}` : 'Java';
  return { frameworks, runtime, ecosystem: 'Java' };
}

export async function detectFrameworks(rootDir: string): Promise<FrameworkReport> {
  // Try each ecosystem in priority order; use the first one that produces results
  const result =
    (await fromPackageJson(rootDir)) ??
    (await fromGoMod(rootDir)) ??
    (await fromCargoToml(rootDir)) ??
    (await fromPythonManifests(rootDir)) ??
    (await fromCMake(rootDir)) ??
    (await fromJava(rootDir)) ??
    (await fromTerraform(rootDir));

  if (!result || result.frameworks.length === 0) {
    // Still return a useful summary if we know the ecosystem (e.g. Terraform with no providers)
    const summary = result?.ecosystem && result.ecosystem !== 'Unknown'
      ? `${result.ecosystem} project`
      : 'Unknown project type';
    return {
      summary,
      primary: [],
      secondary: [],
      all: [],
      ecosystem: result?.ecosystem ?? 'Unknown',
      runtime: result?.runtime ?? null,
    };
  }

  // Deduplicate by name
  const seen = new Set<string>();
  const unique = result.frameworks.filter((f) => {
    if (seen.has(f.name)) return false;
    seen.add(f.name);
    return true;
  });

  const primary = unique.filter((f) => PRIMARY_CATEGORIES.includes(f.category));
  const secondary = unique.filter((f) => !PRIMARY_CATEGORIES.includes(f.category));
  const summary = buildSummary(unique, result.ecosystem);

  return {
    summary,
    primary,
    secondary,
    all: unique,
    ecosystem: result.ecosystem,
    runtime: result.runtime,
  };
}
