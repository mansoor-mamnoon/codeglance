import { describe, it, expect } from 'vitest';
import { rankStartHereFiles } from '../../src/detectors/starthere.js';
import type { ScannedFile } from '../../src/scanner.js';

function makeFile(relativePath: string, language: string, lines: number): ScannedFile {
  return {
    path: `/repo/${relativePath}`,
    relativePath,
    language,
    lines,
    bytes: lines * 40,
  };
}

describe('rankStartHereFiles', () => {
  it('ranks src/index.ts highly', () => {
    const files = [
      makeFile('src/index.ts', 'TypeScript', 200),
      makeFile('src/utils/helper.ts', 'TypeScript', 200),
      makeFile('src/config/db.ts', 'TypeScript', 200),
    ];
    const result = rankStartHereFiles(files);
    expect(result[0].relativePath).toBe('src/index.ts');
  });

  it('promotes main.go above deep internal files', () => {
    const files = [
      makeFile('internal/store/postgres/queries.go', 'Go', 300),
      makeFile('main.go', 'Go', 80),
    ];
    const result = rankStartHereFiles(files);
    expect(result[0].relativePath).toBe('main.go');
  });

  it('excludes test files', () => {
    const files = [
      makeFile('src/server.ts', 'TypeScript', 200),
      makeFile('src/__tests__/server.test.ts', 'TypeScript', 200),
      makeFile('tests/integration.test.ts', 'TypeScript', 200),
    ];
    const result = rankStartHereFiles(files);
    const paths = result.map((r) => r.relativePath);
    expect(paths).not.toContain('src/__tests__/server.test.ts');
    expect(paths).not.toContain('tests/integration.test.ts');
    expect(paths).toContain('src/server.ts');
  });

  it('excludes tiny files (< 15 lines)', () => {
    const files = [
      makeFile('src/index.ts', 'TypeScript', 10),
      makeFile('src/server.ts', 'TypeScript', 200),
    ];
    const result = rankStartHereFiles(files);
    const paths = result.map((r) => r.relativePath);
    expect(paths).not.toContain('src/index.ts');
  });

  it('excludes very large files (> 2000 lines)', () => {
    const files = [
      makeFile('src/huge.ts', 'TypeScript', 5000),
      makeFile('src/router.ts', 'TypeScript', 200),
    ];
    const result = rankStartHereFiles(files);
    const paths = result.map((r) => r.relativePath);
    expect(paths).not.toContain('src/huge.ts');
  });

  it('excludes .d.ts files', () => {
    const files = [
      makeFile('src/types.d.ts', 'TypeScript', 100),
      makeFile('src/router.ts', 'TypeScript', 100),
    ];
    const result = rankStartHereFiles(files);
    const paths = result.map((r) => r.relativePath);
    expect(paths).not.toContain('src/types.d.ts');
  });

  it('respects limit parameter', () => {
    const files = Array.from({ length: 20 }, (_, i) =>
      makeFile(`src/file${i}.ts`, 'TypeScript', 100 + i * 5),
    );
    const result = rankStartHereFiles(files, 3);
    expect(result).toHaveLength(3);
  });

  it('returns empty array for empty input', () => {
    expect(rankStartHereFiles([])).toHaveLength(0);
  });
});
