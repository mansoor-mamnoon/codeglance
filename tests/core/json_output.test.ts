import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '../../src/analyzer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '..', 'fixtures');

describe('JSON output — structural stability', () => {
  it('contains all required top-level keys', async () => {
    const result = await analyze(path.join(FIXTURES, 'node-project'));
    const required = ['rootDir', 'name', 'durationMs', 'filesCapped', 'totalFiles', 'totalLines',
                      'frameworks', 'scripts', 'entryPoints', 'startHere', 'languages', 'tools', 'git'];
    for (const key of required) {
      expect(result).toHaveProperty(key);
    }
  });

  it('frameworks object has required shape', async () => {
    const result = await analyze(path.join(FIXTURES, 'node-project'));
    expect(result.frameworks).toHaveProperty('summary');
    expect(result.frameworks).toHaveProperty('primary');
    expect(result.frameworks).toHaveProperty('secondary');
    expect(result.frameworks).toHaveProperty('all');
    expect(result.frameworks).toHaveProperty('ecosystem');
    expect(result.frameworks).toHaveProperty('runtime');
    expect(Array.isArray(result.frameworks.all)).toBe(true);
  });

  it('scripts object has required shape', async () => {
    const result = await analyze(path.join(FIXTURES, 'node-project'));
    expect(result.scripts).toHaveProperty('commands');
    expect(result.scripts).toHaveProperty('packageManager');
    expect(Array.isArray(result.scripts.commands)).toBe(true);
    for (const cmd of result.scripts.commands) {
      expect(cmd).toHaveProperty('command');
      expect(cmd).toHaveProperty('description');
      expect(cmd).toHaveProperty('kind');
      expect(cmd).toHaveProperty('source');
    }
  });

  it('tools object has required shape', async () => {
    const result = await analyze(path.join(FIXTURES, 'node-project'));
    const t = result.tools;
    expect(t).toHaveProperty('ci');
    expect(t).toHaveProperty('ciWorkflowCount');
    expect(t).toHaveProperty('container');
    expect(t).toHaveProperty('linting');
    expect(t).toHaveProperty('hasEnvFile');
    expect(t).toHaveProperty('hasReadme');
    expect(t).toHaveProperty('hasLicense');
    expect(t).toHaveProperty('hasTests');
    expect(t).toHaveProperty('hasChangelog');
    expect(t).toHaveProperty('hasContributing');
  });

  it('language stats have required shape', async () => {
    const result = await analyze(path.join(FIXTURES, 'node-project'));
    expect(Array.isArray(result.languages)).toBe(true);
    for (const lang of result.languages) {
      expect(lang).toHaveProperty('name');
      expect(lang).toHaveProperty('files');
      expect(lang).toHaveProperty('lines');
      expect(lang).toHaveProperty('percentage');
      expect(typeof lang.name).toBe('string');
      expect(typeof lang.files).toBe('number');
      expect(typeof lang.lines).toBe('number');
      expect(typeof lang.percentage).toBe('number');
    }
  });

  it('git report has required shape', async () => {
    const result = await analyze(path.join(FIXTURES, 'node-project'));
    expect(result.git).toHaveProperty('isRepo');
    // git detection in fixtures may fail (no .git dir) — just check the shape
    if (result.git.isRepo) {
      expect(result.git).toHaveProperty('branch');
      expect(result.git).toHaveProperty('lastCommit');
      expect(result.git).toHaveProperty('recentCommits');
      expect(result.git).toHaveProperty('recentContributors');
    }
  });

  it('is fully JSON-serializable', async () => {
    const result = await analyze(path.join(FIXTURES, 'node-project'));
    expect(() => JSON.stringify(result)).not.toThrow();
    const json = JSON.stringify(result);
    expect(typeof json).toBe('string');
    // Should round-trip cleanly
    const parsed = JSON.parse(json) as unknown;
    expect(parsed).toBeTruthy();
  });

  it('durationMs is a positive number', async () => {
    const result = await analyze(path.join(FIXTURES, 'node-project'));
    expect(result.durationMs).toBeGreaterThan(0);
    expect(typeof result.durationMs).toBe('number');
  });

  it('totalFiles and totalLines are non-negative integers', async () => {
    const result = await analyze(path.join(FIXTURES, 'node-project'));
    expect(result.totalFiles).toBeGreaterThanOrEqual(0);
    expect(result.totalLines).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.totalFiles)).toBe(true);
    expect(Number.isInteger(result.totalLines)).toBe(true);
  });
});

describe('JSON output — cross-ecosystem consistency', () => {
  const fixtures = ['node-project', 'go-project', 'rust-project', 'python-project', 'cpp-project'];

  for (const fixture of fixtures) {
    it(`${fixture}: produces valid JSON with correct ecosystem`, async () => {
      const result = await analyze(path.join(FIXTURES, fixture));
      expect(() => JSON.stringify(result)).not.toThrow();
      expect(result.frameworks.ecosystem).not.toBe('');
      expect(result.totalFiles).toBeGreaterThan(0);
    });
  }
});
