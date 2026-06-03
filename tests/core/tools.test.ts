import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectTools } from '../../src/detectors/tools.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '..', 'fixtures');

describe('detectTools — compose env vars', () => {
  const dir = path.join(FIXTURES, 'terraform-project');

  it('detects required env vars from docker-compose', async () => {
    const result = await detectTools(dir, 'Terraform');
    expect(result.composeEnvVars).toContain('DATABASE_URL');
    expect(result.composeEnvVars).toContain('SECRET_KEY');
    expect(result.composeEnvVars).toContain('AWS_ACCESS_KEY_ID');
    expect(result.composeEnvVars).toContain('POSTGRES_PASSWORD');
  });

  it('ignores vars that have a default value', async () => {
    const result = await detectTools(dir, 'Terraform');
    // PORT=8080, NODE_ENV=production, POSTGRES_DB=myapp all have defaults
    expect(result.composeEnvVars).not.toContain('PORT');
    expect(result.composeEnvVars).not.toContain('NODE_ENV');
    expect(result.composeEnvVars).not.toContain('POSTGRES_DB');
  });

  it('returns empty array when no docker-compose present', async () => {
    const result = await detectTools(path.join(FIXTURES, 'go-project'), 'Go');
    expect(result.composeEnvVars).toHaveLength(0);
  });
});
