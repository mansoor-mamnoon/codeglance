import { describe, it, expect } from 'vitest';
import { detectLanguage, computeLanguageStats } from '../../src/detectors/languages.js';
import type { ScannedFile } from '../../src/scanner.js';

describe('detectLanguage', () => {
  it('detects TypeScript files', () => {
    expect(detectLanguage('src/index.ts')).toBe('TypeScript');
    expect(detectLanguage('component.tsx')).toBe('TypeScript');
    expect(detectLanguage('module.mts')).toBe('TypeScript');
  });

  it('detects JavaScript files', () => {
    expect(detectLanguage('app.js')).toBe('JavaScript');
    expect(detectLanguage('App.jsx')).toBe('JavaScript');
    expect(detectLanguage('worker.mjs')).toBe('JavaScript');
  });

  it('detects Go files', () => {
    expect(detectLanguage('main.go')).toBe('Go');
    expect(detectLanguage('cmd/server/main.go')).toBe('Go');
  });

  it('detects Rust files', () => {
    expect(detectLanguage('src/main.rs')).toBe('Rust');
    expect(detectLanguage('lib.rs')).toBe('Rust');
  });

  it('detects Python files', () => {
    expect(detectLanguage('main.py')).toBe('Python');
    expect(detectLanguage('app.py')).toBe('Python');
  });

  it('detects Dockerfile by exact filename', () => {
    expect(detectLanguage('Dockerfile')).toBe('Dockerfile');
    expect(detectLanguage('/path/to/Dockerfile')).toBe('Dockerfile');
  });

  it('detects Makefile by exact filename', () => {
    expect(detectLanguage('Makefile')).toBe('Makefile');
    expect(detectLanguage('GNUmakefile')).toBe('Makefile');
  });

  it('detects web files', () => {
    expect(detectLanguage('styles.css')).toBe('CSS');
    expect(detectLanguage('theme.scss')).toBe('SCSS');
    expect(detectLanguage('App.vue')).toBe('Vue');
    expect(detectLanguage('Page.svelte')).toBe('Svelte');
  });

  it('returns null for unknown extensions', () => {
    expect(detectLanguage('binary.exe')).toBeNull();
    expect(detectLanguage('archive.zip')).toBeNull();
    expect(detectLanguage('noextension')).toBeNull();
  });

  it('is case-insensitive for extensions', () => {
    expect(detectLanguage('Main.TS')).toBe('TypeScript');
    expect(detectLanguage('app.PY')).toBe('Python');
  });
});

describe('computeLanguageStats', () => {
  const makeFile = (language: string, lines: number): ScannedFile => ({
    path: `/fake/${language}.ts`,
    relativePath: `${language}.ts`,
    language,
    lines,
    bytes: lines * 40,
  });

  it('sorts by line count descending', () => {
    const files: ScannedFile[] = [
      makeFile('JavaScript', 100),
      makeFile('TypeScript', 500),
      makeFile('CSS', 50),
    ];
    const stats = computeLanguageStats(files);
    expect(stats[0].name).toBe('TypeScript');
    expect(stats[1].name).toBe('JavaScript');
    expect(stats[2].name).toBe('CSS');
  });

  it('computes correct percentages', () => {
    const files: ScannedFile[] = [
      makeFile('TypeScript', 800),
      makeFile('JavaScript', 200),
    ];
    const stats = computeLanguageStats(files);
    expect(stats.find((s) => s.name === 'TypeScript')?.percentage).toBe(80);
    expect(stats.find((s) => s.name === 'JavaScript')?.percentage).toBe(20);
  });

  it('aggregates files with the same language', () => {
    const files: ScannedFile[] = [
      makeFile('TypeScript', 100),
      makeFile('TypeScript', 200),
      makeFile('TypeScript', 300),
    ];
    const stats = computeLanguageStats(files);
    expect(stats).toHaveLength(1);
    expect(stats[0].files).toBe(3);
    expect(stats[0].lines).toBe(600);
  });

  it('skips files with null lines', () => {
    const files: ScannedFile[] = [
      { path: '/f', relativePath: 'f', language: 'TypeScript', lines: null, bytes: 0 },
      makeFile('TypeScript', 100),
    ];
    const stats = computeLanguageStats(files);
    expect(stats[0].files).toBe(1);
    expect(stats[0].lines).toBe(100);
  });
});
