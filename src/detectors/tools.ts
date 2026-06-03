import { readdir, readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import path from 'node:path';

export interface ToolsReport {
  ci: string | null;
  ciWorkflowCount: number;
  container: string[];
  testFramework: string | null;
  linting: string[];
  hasEnvFile: boolean;
  envFiles: string[];
  /** Env vars declared in docker-compose without a default value — must be set before running */
  composeEnvVars: string[];
  hasReadme: boolean;
  hasChangelog: boolean;
  hasContributing: boolean;
  hasLicense: boolean;
  hasTests: boolean;
  testDirHint: string | null;
}

async function fileExists(p: string): Promise<boolean> {
  try { await access(p); return true; }
  catch { return false; }
}

async function dirExists(p: string): Promise<boolean> {
  try {
    const { stat } = await import('node:fs/promises');
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function countWorkflows(rootDir: string): Promise<number> {
  try {
    const entries = await readdir(path.join(rootDir, '.github', 'workflows'));
    return entries.filter((e) => e.endsWith('.yml') || e.endsWith('.yaml')).length;
  } catch {
    return 0;
  }
}

/**
 * Reads docker-compose.yml and returns env var names that have no default
 * value — i.e. they must be supplied by the host before the container runs.
 * Handles both list form (`- VAR_NAME`) and map form (`VAR_NAME:`).
 */
async function detectComposeEnvVars(rootDir: string): Promise<string[]> {
  const candidates = ['docker-compose.yml', 'docker-compose.yaml'];
  for (const name of candidates) {
    const filePath = path.join(rootDir, name);
    try {
      const content = await readFile(filePath, 'utf8');
      const vars = new Set<string>();

      // List form:  - VAR_NAME          (no = means no default)
      // Value form: - VAR_NAME=value    (has default — skip)
      // Ref form:   - VAR_NAME=${OTHER} (references another var — skip)
      for (const m of content.matchAll(/^\s+-\s+([A-Z_][A-Z0-9_]*)(?:\s*$)/gm)) {
        if (m[1]) vars.add(m[1]);
      }

      // Map form:   VAR_NAME:           (null value means "required from host")
      // Map form:   VAR_NAME: value     (has default — skip)
      for (const m of content.matchAll(/^\s{4,}([A-Z_][A-Z0-9_]*):\s*$/gm)) {
        if (m[1]) vars.add(m[1]);
      }

      if (vars.size > 0) return [...vars].sort();
    } catch { /* file absent or unreadable */ }
  }
  return [];
}

async function detectEnvFiles(rootDir: string): Promise<string[]> {
  const candidates = ['.env', '.env.local', '.env.example', '.env.sample', '.env.development', '.env.production'];
  const found: string[] = [];
  for (const f of candidates) {
    if (await fileExists(path.join(rootDir, f))) found.push(f);
  }
  return found;
}

async function detectTestDir(rootDir: string): Promise<string | null> {
  const candidates = ['__tests__', 'tests', 'test', 'spec', 'e2e', 'integration'];
  for (const d of candidates) {
    if (await dirExists(path.join(rootDir, d))) return d + '/';
  }
  // Check src/tests or src/__tests__
  for (const d of ['__tests__', 'tests', 'test', 'spec']) {
    if (await dirExists(path.join(rootDir, 'src', d))) return `src/${d}/`;
  }
  return null;
}

async function detectReadme(rootDir: string): Promise<boolean> {
  const variants = ['README.md', 'readme.md', 'README.rst', 'README.txt', 'README'];
  for (const f of variants) {
    if (await fileExists(path.join(rootDir, f))) return true;
  }
  return false;
}

async function detectLicense(rootDir: string): Promise<boolean> {
  const variants = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'COPYING'];
  for (const f of variants) {
    if (await fileExists(path.join(rootDir, f))) return true;
  }
  return false;
}

async function detectLinting(rootDir: string, ecosystem: string): Promise<string[]> {
  const found: string[] = [];

  if (ecosystem === 'Node.js') {
    const candidates: Array<[string[], string]> = [
      [['biome.json', 'biome.jsonc'], 'Biome'],
      [['.eslintrc', '.eslintrc.js', '.eslintrc.json', '.eslintrc.cjs', '.eslintrc.yaml', '.eslintrc.yml', 'eslint.config.js', 'eslint.config.mjs'], 'ESLint'],
      [['.prettierrc', '.prettierrc.js', '.prettierrc.json', '.prettierrc.yaml', 'prettier.config.js', 'prettier.config.mjs'], 'Prettier'],
      [['.husky'], 'Husky'],
    ];
    for (const [files, name] of candidates) {
      for (const f of files) {
        if (await fileExists(path.join(rootDir, f)) || await dirExists(path.join(rootDir, f))) {
          found.push(name);
          break;
        }
      }
    }
  } else if (ecosystem === 'Python') {
    try {
      const pyproject = await (await import('node:fs/promises')).readFile(
        path.join(rootDir, 'pyproject.toml'), 'utf8',
      );
      if (pyproject.includes('[tool.ruff]')) found.push('Ruff');
      if (pyproject.includes('[tool.black]')) found.push('Black');
      if (pyproject.includes('[tool.mypy]')) found.push('mypy');
      if (pyproject.includes('[tool.flake8]') || await fileExists(path.join(rootDir, '.flake8'))) found.push('flake8');
    } catch { /* ok */ }
  } else if (ecosystem === 'Rust') {
    found.push('rustfmt'); // built-in
    found.push('Clippy');  // built-in
  } else if (ecosystem === 'Go') {
    if (await fileExists(path.join(rootDir, '.golangci.yml')) || await fileExists(path.join(rootDir, '.golangci.yaml'))) {
      found.push('golangci-lint');
    } else {
      found.push('go vet'); // built-in
    }
  }

  return found;
}

export async function detectTools(rootDir: string, ecosystem: string): Promise<ToolsReport> {
  const [
    ghWorkflowCount,
    hasCircleCi,
    hasTravis,
    hasGitLabCi,
    hasJenkins,
    hasAzure,
    hasDocker,
    hasDockerCompose,
    envFiles,
    composeEnvVars,
    testDir,
    hasReadme,
    hasChangelog,
    hasContributing,
    hasLicense,
    linting,
  ] = await Promise.all([
    countWorkflows(rootDir),
    fileExists(path.join(rootDir, '.circleci', 'config.yml')),
    fileExists(path.join(rootDir, '.travis.yml')),
    fileExists(path.join(rootDir, '.gitlab-ci.yml')),
    fileExists(path.join(rootDir, 'Jenkinsfile')),
    fileExists(path.join(rootDir, 'azure-pipelines.yml')),
    fileExists(path.join(rootDir, 'Dockerfile')),
    fileExists(path.join(rootDir, 'docker-compose.yml')).then(
      (a) => a || fileExists(path.join(rootDir, 'docker-compose.yaml')),
    ),
    detectEnvFiles(rootDir),
    detectComposeEnvVars(rootDir),
    detectTestDir(rootDir),
    detectReadme(rootDir),
    fileExists(path.join(rootDir, 'CHANGELOG.md')).then(
      (a) => a || fileExists(path.join(rootDir, 'CHANGELOG')),
    ),
    fileExists(path.join(rootDir, 'CONTRIBUTING.md')).then(
      (a) => a || fileExists(path.join(rootDir, 'CONTRIBUTING')),
    ),
    detectLicense(rootDir),
    detectLinting(rootDir, ecosystem),
  ]);

  let ci: string | null = null;
  let ciWorkflowCount = 0;
  if (ghWorkflowCount > 0) { ci = 'GitHub Actions'; ciWorkflowCount = ghWorkflowCount; }
  else if (hasCircleCi)   ci = 'CircleCI';
  else if (hasGitLabCi)   ci = 'GitLab CI';
  else if (hasTravis)     ci = 'Travis CI';
  else if (hasJenkins)    ci = 'Jenkins';
  else if (hasAzure)      ci = 'Azure Pipelines';

  const container: string[] = [];
  if (hasDocker)       container.push('Docker');
  if (hasDockerCompose) container.push('docker-compose');

  return {
    ci,
    ciWorkflowCount,
    container,
    testFramework: null, // filled by framework detector
    linting,
    hasEnvFile: envFiles.length > 0,
    envFiles,
    composeEnvVars,
    hasReadme,
    hasChangelog,
    hasContributing,
    hasLicense,
    hasTests: testDir !== null,
    testDirHint: testDir,
  };
}
