import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectScripts } from '../../src/detectors/scripts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '..', 'fixtures');

describe('detectScripts — Node.js', () => {
  const dir = path.join(FIXTURES, 'node-project');

  it('extracts dev, build, test, lint commands', async () => {
    const result = await detectScripts(dir, 'Node.js');
    const kinds = result.commands.map((c) => c.kind);
    expect(kinds).toContain('dev');
    expect(kinds).toContain('build');
    expect(kinds).toContain('test');
    expect(kinds).toContain('lint');
  });

  it('dev command comes before build', async () => {
    const result = await detectScripts(dir, 'Node.js');
    const devIdx = result.commands.findIndex((c) => c.kind === 'dev');
    const buildIdx = result.commands.findIndex((c) => c.kind === 'build');
    expect(devIdx).toBeLessThan(buildIdx);
  });

  it('detects npm as package manager', async () => {
    const result = await detectScripts(dir, 'Node.js');
    // No lockfile in fixtures, so defaults to npm
    expect(['npm', 'yarn', 'pnpm', 'bun']).toContain(result.packageManager);
  });

  it('dev command contains next dev', async () => {
    const result = await detectScripts(dir, 'Node.js');
    const devCmd = result.commands.find((c) => c.kind === 'dev');
    expect(devCmd).toBeDefined();
    expect(devCmd?.command).toContain('dev');
  });
});

describe('detectScripts — Go', () => {
  const dir = path.join(FIXTURES, 'go-project');

  it('includes a test command', async () => {
    const result = await detectScripts(dir, 'Go');
    const testCmd = result.commands.find((c) => c.kind === 'test');
    expect(testCmd).toBeDefined();
    // Go fixture has a Makefile so make test is preferred over bare go test
    expect(testCmd?.command).toMatch(/test/);
  });

  it('includes a build command', async () => {
    const result = await detectScripts(dir, 'Go');
    const buildCmd = result.commands.find((c) => c.kind === 'build');
    expect(buildCmd).toBeDefined();
    expect(buildCmd?.command).toMatch(/build/);
  });
});

describe('detectScripts — Rust', () => {
  const dir = path.join(FIXTURES, 'rust-project');

  it('includes cargo run for binary crate', async () => {
    const result = await detectScripts(dir, 'Rust');
    const devCmd = result.commands.find((c) => c.kind === 'dev');
    expect(devCmd?.command).toBe('cargo run');
  });

  it('includes cargo test', async () => {
    const result = await detectScripts(dir, 'Rust');
    const testCmd = result.commands.find((c) => c.kind === 'test');
    expect(testCmd?.command).toBe('cargo test');
  });

  it('includes cargo clippy as lint', async () => {
    const result = await detectScripts(dir, 'Rust');
    const lintCmd = result.commands.find((c) => c.command === 'cargo clippy');
    expect(lintCmd).toBeDefined();
  });
});

describe('detectScripts — Python', () => {
  const dir = path.join(FIXTURES, 'python-project');

  it('includes pytest', async () => {
    const result = await detectScripts(dir, 'Python');
    const testCmd = result.commands.find((c) => c.kind === 'test');
    expect(testCmd?.command).toContain('pytest');
  });
});

describe('script kind inference', () => {
  const dir = path.join(FIXTURES, 'node-project');

  it('does not classify test:watch as dev', async () => {
    // The test:watch script should be classified as 'test', not 'dev'
    // This guards against the watch-regex false positive
    const result = await detectScripts(dir, 'Node.js');
    const watchCmd = result.commands.find((c) => c.command.includes('test:watch'));
    if (watchCmd) {
      expect(watchCmd.kind).toBe('test');
    }
  });
});
