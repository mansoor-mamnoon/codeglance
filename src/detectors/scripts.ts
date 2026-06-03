import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

export type ScriptKind = 'dev' | 'build' | 'test' | 'lint' | 'start' | 'deploy' | 'other';

export interface RunCommand {
  /** The command to run */
  command: string;
  /** Brief description inferred from name / command content */
  description: string;
  kind: ScriptKind;
  /** Where it was found */
  source: string;
}

async function exists(p: string): Promise<boolean> {
  try { await access(p); return true; }
  catch { return false; }
}

// Heuristic kind from npm script name.
// Order matters: test must be checked before dev to prevent test:watch
// from matching the `watch` fragment.
function inferKind(name: string, cmd: string): ScriptKind {
  const n = name.toLowerCase();
  const c = cmd.toLowerCase();
  if (/^(test|spec|e2e|coverage|typecheck|check:types)/.test(n) || /\bjest\b|\bvitest\b|playwright|cypress|mocha/.test(c)) return 'test';
  if (/^(build|compile|bundle|generate|export)/.test(n)) return 'build';
  if (/^(lint|eslint|biome|format|fmt)/.test(n) || /eslint|prettier|biome|ruff|flake8/.test(c)) return 'lint';
  if (/^start$/.test(n)) return 'start';
  if (/^dev$|^develop$|^start:dev$|^watch$/.test(n) || /next dev|(?<![a-z])vite(?![a-z])|tsx watch|nodemon/.test(c)) return 'dev';
  if (/deploy|release|publish|ship/.test(n)) return 'deploy';
  return 'other';
}

// Human-readable description from script name
function describeScript(name: string, cmd: string): string {
  const n = name.toLowerCase();
  if (n === 'dev' || n === 'start:dev') return 'start development server';
  if (n === 'build') {
    if (/tsup|ncc\b|\bpkg\b/.test(cmd)) return 'bundle CLI for distribution';
    return 'build for production';
  }
  if (n === 'start') return 'start production server';
  if (n === 'test') return 'run test suite';
  if (n.includes('e2e')) return 'run end-to-end tests';
  if (n.includes('watch')) return 'run tests in watch mode';
  if (n.includes('coverage')) return 'run tests with coverage';
  if (n === 'lint') return 'lint codebase';
  if (n === 'format' || n === 'fmt') {
    if (/prettier/.test(cmd)) return 'format code with Prettier';
    if (/biome/.test(cmd)) return 'format code with Biome';
    return 'format code';
  }
  if (n === 'typecheck' || n === 'check:types' || n === 'type-check') return 'run TypeScript type checker';
  if (n === 'preview') return 'preview production build';
  if (n === 'deploy') return 'deploy to production';
  if (n === 'db:migrate' || n === 'migrate') return 'run database migrations';
  if (n === 'db:seed' || n === 'seed') return 'seed database';
  if (n === 'generate' || n === 'gen') return 'run code generation';
  if (/next dev/.test(cmd)) return 'start Next.js dev server';
  if (/(?<![a-z])vite(?![a-z])/.test(cmd)) return 'start Vite dev server';
  if (/\bvitest\b/.test(cmd)) return 'run Vitest test suite';
  if (/prisma/.test(cmd)) return 'Prisma operation';
  return name;
}

async function fromPackageJson(rootDir: string): Promise<RunCommand[]> {
  try {
    const content = await readFile(path.join(rootDir, 'package.json'), 'utf8');
    const pkg = JSON.parse(content) as { scripts?: Record<string, string> };
    if (!pkg.scripts) return [];

    // Detect package manager from lockfile
    let pm = 'npm';
    if (await exists(path.join(rootDir, 'bun.lockb'))) pm = 'bun';
    else if (await exists(path.join(rootDir, 'pnpm-lock.yaml'))) pm = 'pnpm';
    else if (await exists(path.join(rootDir, 'yarn.lock'))) pm = 'yarn';

    const runPrefix = pm === 'npm' ? 'npm run' : pm;

    // Prioritize most useful scripts: dev, build, test, lint first
    const PRIORITY = ['dev', 'start:dev', 'develop', 'build', 'start', 'test', 'lint', 'format', 'typecheck'];
    const scripts = Object.entries(pkg.scripts);

    const prioritized = [
      ...PRIORITY.map((p) => scripts.find(([k]) => k === p)).filter(Boolean) as [string, string][],
      ...scripts.filter(([k]) => !PRIORITY.includes(k)),
    ];

    return prioritized.slice(0, 10).map(([name, cmd]) => ({
      command: `${runPrefix} ${name}`,
      description: describeScript(name, cmd),
      kind: inferKind(name, cmd),
      source: 'package.json',
    }));
  } catch {
    return [];
  }
}

async function fromMakefile(rootDir: string): Promise<RunCommand[]> {
  for (const name of ['Makefile', 'makefile', 'GNUmakefile']) {
    const filePath = path.join(rootDir, name);
    if (!(await exists(filePath))) continue;

    try {
      const content = await readFile(filePath, 'utf8');
      const targets: RunCommand[] = [];

      // Match targets: lines like `target_name:` or `target_name: deps`
      // Skip special targets (.PHONY etc.) and internal ones starting with _
      const lines = content.split('\n');
      for (const line of lines) {
        const m = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(?:[^=]|$)/);
        if (!m || !m[1]) continue;
        const target = m[1];
        if (target.startsWith('.') || target.startsWith('_')) continue;
        if (target === 'all' && targets.length > 0) continue; // 'all' is implied

        const kind = inferKind(target, '');
        targets.push({
          command: `make ${target}`,
          description: describeScript(target, ''),
          kind,
          source: 'Makefile',
        });

        if (targets.length >= 8) break;
      }

      return targets;
    } catch {
      return [];
    }
  }
  return [];
}

async function fromCargoToml(rootDir: string): Promise<RunCommand[]> {
  if (!(await exists(path.join(rootDir, 'Cargo.toml')))) return [];

  // Check if it's a binary crate (has src/main.rs or [[bin]])
  const hasBin = await exists(path.join(rootDir, 'src', 'main.rs'));
  const hasBench = await exists(path.join(rootDir, 'benches'));
  const commands: RunCommand[] = [
    { command: 'cargo build',       description: 'compile the project',            kind: 'build',  source: 'Cargo.toml' },
    { command: 'cargo test',        description: 'run test suite',                  kind: 'test',   source: 'Cargo.toml' },
    { command: 'cargo clippy',      description: 'run linter',                      kind: 'lint',   source: 'Cargo.toml' },
    { command: 'cargo fmt',         description: 'format code',                     kind: 'lint',   source: 'Cargo.toml' },
  ];
  if (hasBin) {
    commands.unshift({ command: 'cargo run', description: 'run the binary', kind: 'dev', source: 'Cargo.toml' });
  }
  if (hasBench) {
    commands.push({ command: 'cargo bench', description: 'run benchmarks', kind: 'test', source: 'Cargo.toml' });
  }
  return commands;
}

async function fromGoMod(rootDir: string): Promise<RunCommand[]> {
  if (!(await exists(path.join(rootDir, 'go.mod')))) return [];

  const commands: RunCommand[] = [
    { command: 'go build ./...',    description: 'compile all packages',   kind: 'build', source: 'go.mod' },
    { command: 'go test ./...',     description: 'run test suite',          kind: 'test',  source: 'go.mod' },
    { command: 'go vet ./...',      description: 'run static analysis',     kind: 'lint',  source: 'go.mod' },
  ];

  // Check for cmd/ directory → runnable binaries
  if (await exists(path.join(rootDir, 'cmd'))) {
    commands.unshift({ command: 'go run ./cmd/...', description: 'run main command(s)', kind: 'dev', source: 'go.mod' });
  } else if (await exists(path.join(rootDir, 'main.go'))) {
    commands.unshift({ command: 'go run .', description: 'run main package', kind: 'dev', source: 'go.mod' });
  }

  return commands;
}

async function fromPython(rootDir: string): Promise<RunCommand[]> {
  // Check for task runner configs in pyproject.toml
  try {
    const content = await readFile(path.join(rootDir, 'pyproject.toml'), 'utf8');
    const commands: RunCommand[] = [];

    // taskipy tasks
    const taskipy = content.match(/\[tool\.taskipy\.tasks\]([\s\S]*?)(?=\[|$)/);
    if (taskipy) {
      for (const line of taskipy[1].split('\n')) {
        const m = line.match(/^(\w+)\s*=\s*"([^"]+)"/);
        if (m && m[1] && m[2]) {
          commands.push({
            command: `task ${m[1]}`,
            description: describeScript(m[1], m[2]),
            kind: inferKind(m[1], m[2]),
            source: 'pyproject.toml',
          });
        }
      }
    }

    if (commands.length > 0) return commands;
  } catch { /* ok */ }

  // Fall back to common Python commands
  const commands: RunCommand[] = [];

  if (await exists(path.join(rootDir, 'manage.py'))) {
    commands.push({ command: 'python manage.py runserver', description: 'start Django dev server', kind: 'dev', source: 'manage.py' });
    commands.push({ command: 'python manage.py test', description: 'run Django tests', kind: 'test', source: 'manage.py' });
    commands.push({ command: 'python manage.py migrate', description: 'run database migrations', kind: 'other', source: 'manage.py' });
  } else {
    const entry = (await exists(path.join(rootDir, 'main.py'))) ? 'main.py'
                : (await exists(path.join(rootDir, 'app.py')))  ? 'app.py' : null;
    if (entry) {
      commands.push({ command: `python ${entry}`, description: 'run application', kind: 'start', source: entry });
    }
    commands.push({ command: 'pytest', description: 'run test suite', kind: 'test', source: 'pytest' });

    // Check for ruff/black
    try {
      const pyproject = await readFile(path.join(rootDir, 'pyproject.toml'), 'utf8');
      if (pyproject.includes('[tool.ruff]')) {
        commands.push({ command: 'ruff check .', description: 'lint with Ruff', kind: 'lint', source: 'pyproject.toml' });
      }
      if (pyproject.includes('[tool.black]')) {
        commands.push({ command: 'black .', description: 'format with Black', kind: 'lint', source: 'pyproject.toml' });
      }
    } catch { /* ok */ }
  }

  return commands;
}

async function fromCMake(rootDir: string): Promise<RunCommand[]> {
  if (!(await exists(path.join(rootDir, 'CMakeLists.txt')))) return [];

  // Try Makefile wrapper first (common pattern: cmake via Makefile)
  const makeCommands = await fromMakefile(rootDir);
  if (makeCommands.length > 0) return makeCommands;

  return [
    { command: 'cmake -B build',         description: 'configure build system', kind: 'build', source: 'CMakeLists.txt' },
    { command: 'cmake --build build',    description: 'compile project',         kind: 'build', source: 'CMakeLists.txt' },
    { command: 'ctest --test-dir build', description: 'run test suite',          kind: 'test',  source: 'CMakeLists.txt' },
  ];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ScriptsReport {
  commands: RunCommand[];
  packageManager: string | null;
}

export async function detectScripts(rootDir: string, ecosystem: string): Promise<ScriptsReport> {
  let commands: RunCommand[] = [];
  let packageManager: string | null = null;

  if (ecosystem === 'Node.js') {
    commands = await fromPackageJson(rootDir);
    if (await exists(path.join(rootDir, 'bun.lockb')))       packageManager = 'bun';
    else if (await exists(path.join(rootDir, 'pnpm-lock.yaml'))) packageManager = 'pnpm';
    else if (await exists(path.join(rootDir, 'yarn.lock')))   packageManager = 'yarn';
    else if (await exists(path.join(rootDir, 'package.json'))) packageManager = 'npm';
  } else if (ecosystem === 'Go') {
    commands = await fromGoMod(rootDir);
  } else if (ecosystem === 'Rust') {
    commands = await fromCargoToml(rootDir);
  } else if (ecosystem === 'Python') {
    commands = await fromPython(rootDir);
  } else if (ecosystem === 'C++' || ecosystem === 'C') {
    commands = await fromCMake(rootDir);
  } else if (ecosystem === 'Java') {
    const hasPom    = await exists(path.join(rootDir, 'pom.xml'));
    const hasGradle = await exists(path.join(rootDir, 'build.gradle')) ||
                      await exists(path.join(rootDir, 'build.gradle.kts'));
    if (hasPom) {
      commands = [
        { command: 'mvn spring-boot:run', description: 'start Spring Boot app',   kind: 'dev',   source: 'pom.xml' },
        { command: 'mvn package',         description: 'build JAR',               kind: 'build', source: 'pom.xml' },
        { command: 'mvn test',            description: 'run test suite',           kind: 'test',  source: 'pom.xml' },
        { command: 'mvn verify',          description: 'run tests + integration',  kind: 'test',  source: 'pom.xml' },
        { command: 'mvn clean',           description: 'clean build output',       kind: 'build', source: 'pom.xml' },
      ];
    } else if (hasGradle) {
      commands = [
        { command: 'gradle bootRun',   description: 'start Spring Boot app', kind: 'dev',   source: 'build.gradle' },
        { command: 'gradle build',     description: 'build JAR',             kind: 'build', source: 'build.gradle' },
        { command: 'gradle test',      description: 'run test suite',        kind: 'test',  source: 'build.gradle' },
        { command: 'gradle clean',     description: 'clean build output',    kind: 'build', source: 'build.gradle' },
      ];
    }
  } else if (ecosystem === 'Terraform') {
    commands = [
      { command: 'terraform init',    description: 'initialise providers and modules', kind: 'build',  source: '*.tf' },
      { command: 'terraform plan',    description: 'preview infrastructure changes',   kind: 'build',  source: '*.tf' },
      { command: 'terraform apply',   description: 'apply infrastructure changes',     kind: 'deploy', source: '*.tf' },
      { command: 'terraform destroy', description: 'destroy all managed resources',    kind: 'deploy', source: '*.tf' },
      { command: 'terraform fmt',     description: 'format configuration files',       kind: 'lint',   source: '*.tf' },
      { command: 'terraform validate', description: 'validate configuration',          kind: 'test',   source: '*.tf' },
    ];
  }

  // Always append Makefile commands when present (common in Go/C/mixed repos)
  if (ecosystem !== 'Node.js') {
    const makeCommands = await fromMakefile(rootDir);
    if (commands.length === 0) {
      commands = makeCommands;
    } else if (makeCommands.length > 0) {
      // Merge: prefer Makefile 'dev', 'build', 'test' over the defaults
      const makeKinds = new Set(makeCommands.map((c) => c.kind));
      const filtered = commands.filter((c) => !makeKinds.has(c.kind));
      commands = [...makeCommands, ...filtered].slice(0, 10);
    }
  }

  // Filter to the most useful commands: dev/build/test first, then others
  const ORDER: ScriptKind[] = ['dev', 'start', 'build', 'test', 'lint', 'deploy', 'other'];
  commands.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));

  return { commands: commands.slice(0, 8), packageManager };
}
