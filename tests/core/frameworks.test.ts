import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectFrameworks } from '../../src/detectors/frameworks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '..', 'fixtures');

describe('detectFrameworks — Node.js', () => {
  const dir = path.join(FIXTURES, 'node-project');

  it('detects Next.js as primary framework', async () => {
    const result = await detectFrameworks(dir);
    expect(result.ecosystem).toBe('Node.js');
    const names = result.all.map((f) => f.name);
    expect(names).toContain('Next.js');
  });

  it('detects React', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('React');
  });

  it('detects Prisma ORM', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('Prisma');
  });

  it('detects Tailwind CSS', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('Tailwind CSS');
  });

  it('detects TypeScript', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('TypeScript');
  });

  it('detects testing frameworks', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('Vitest');
    expect(names).toContain('Testing Library');
  });

  it('generates a meaningful summary', async () => {
    const result = await detectFrameworks(dir);
    expect(result.summary).toContain('Next.js');
  });

  it('extracts runtime from engines field', async () => {
    const result = await detectFrameworks(dir);
    expect(result.runtime).toContain('Node.js');
  });
});

describe('detectFrameworks — Go', () => {
  const dir = path.join(FIXTURES, 'go-project');

  it('detects Go ecosystem', async () => {
    const result = await detectFrameworks(dir);
    expect(result.ecosystem).toBe('Go');
  });

  it('detects Gin as web framework', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('Gin');
  });

  it('detects GORM as ORM', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('GORM');
  });

  it('detects Cobra CLI', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('Cobra');
  });

  it('extracts Go version', async () => {
    const result = await detectFrameworks(dir);
    expect(result.runtime).toContain('Go');
  });
});

describe('detectFrameworks — Rust', () => {
  const dir = path.join(FIXTURES, 'rust-project');

  it('detects Rust ecosystem', async () => {
    const result = await detectFrameworks(dir);
    expect(result.ecosystem).toBe('Rust');
  });

  it('detects Axum', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('Axum');
  });

  it('detects Tokio', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('Tokio');
  });

  it('detects Clap CLI', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('Clap');
  });

  it('includes Rust edition in runtime', async () => {
    const result = await detectFrameworks(dir);
    expect(result.runtime).toContain('2021');
  });
});

describe('detectFrameworks — Python', () => {
  const dir = path.join(FIXTURES, 'python-project');

  it('detects Python ecosystem', async () => {
    const result = await detectFrameworks(dir);
    expect(result.ecosystem).toBe('Python');
  });

  it('detects FastAPI', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('FastAPI');
  });

  it('detects SQLAlchemy ORM', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('SQLAlchemy');
  });

  it('extracts Python version requirement', async () => {
    const result = await detectFrameworks(dir);
    expect(result.runtime).toContain('3.11');
  });
});

describe('detectFrameworks — Terraform', () => {
  const dir = path.join(FIXTURES, 'terraform-project');

  it('detects Terraform ecosystem', async () => {
    const result = await detectFrameworks(dir);
    expect(result.ecosystem).toBe('Terraform');
  });

  it('summary is Terraform project', async () => {
    const result = await detectFrameworks(dir);
    expect(result.summary).toBe('Terraform project');
  });

  it('runtime includes detected cloud providers', async () => {
    const result = await detectFrameworks(dir);
    expect(result.runtime).toContain('AWS');
    expect(result.runtime).toContain('GCP');
  });

  it('runtime includes module count', async () => {
    const result = await detectFrameworks(dir);
    expect(result.runtime).toContain('2 modules');
  });

  it('runtime includes resource count', async () => {
    const result = await detectFrameworks(dir);
    expect(result.runtime).toContain('3 resources');
  });
});

describe('detectFrameworks — Java (Maven)', () => {
  const dir = path.join(FIXTURES, 'java-project');

  it('detects Java ecosystem', async () => {
    const result = await detectFrameworks(dir);
    expect(result.ecosystem).toBe('Java');
  });

  it('detects Spring Boot as primary framework', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('Spring Boot');
  });

  it('detects Spring Data JPA as ORM', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('Spring Data JPA');
  });

  it('detects Spring Security', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('Spring Security');
  });

  it('extracts Java version from pom.xml', async () => {
    const result = await detectFrameworks(dir);
    expect(result.runtime).toContain('21');
  });

  it('summary includes Spring Boot', async () => {
    const result = await detectFrameworks(dir);
    expect(result.summary).toContain('Spring Boot');
  });
});

describe('detectFrameworks — unknown project', () => {
  it('returns Unknown for a directory with no manifest', async () => {
    const result = await detectFrameworks('/tmp');
    expect(result.ecosystem).toBe('Unknown');
    expect(result.all).toHaveLength(0);
  });
});
