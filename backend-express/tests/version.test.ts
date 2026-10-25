import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from './test-helpers';
import { env } from '../src/config/env';

const original = {
  version: env.APP_VERSION, branch: env.APP_BRANCH, commit: env.APP_COMMIT, builtAt: env.APP_BUILT_AT,
};

afterEach(() => {
  env.APP_VERSION = original.version;
  env.APP_BRANCH = original.branch;
  env.APP_COMMIT = original.commit;
  env.APP_BUILT_AT = original.builtAt;
});

const publicar = () => {
  env.APP_VERSION = 'v1.2-3-gabc1234';
  env.APP_BRANCH = 'release';
  env.APP_COMMIT = 'abc1234';
  env.APP_BUILT_AT = '2026-10-25T20:00:00Z';
};

describe('Versión publicada', () => {
  it('GET /api/version devuelve versión, rama, commit y fecha de compilación', async () => {
    publicar();

    const res = await request(createApp()).get('/api/version');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      service: 'educaspot-backend',
      version: 'v1.2-3-gabc1234',
      branch: 'release',
      commit: 'abc1234',
      builtAt: '2026-10-25T20:00:00Z',
    });
  });

  it('es pública y no expone secretos ni la configuración', async () => {
    publicar();

    const res = await request(createApp()).get('/api/version');   // sin Authorization

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['branch', 'builtAt', 'commit', 'environment', 'service', 'version']);
  });

  it('en local usa valores por defecto y builtAt nulo', async () => {
    env.APP_VERSION = 'dev';
    env.APP_BRANCH = 'local';
    env.APP_COMMIT = 'local';
    env.APP_BUILT_AT = '';

    const res = await request(createApp()).get('/api/version');

    expect(res.body).toMatchObject({ version: 'dev', branch: 'local', commit: 'local', builtAt: null });
  });

  it('/api/health conserva su forma y suma la versión', async () => {
    publicar();

    const res = await request(createApp()).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', service: 'educaspot-backend', version: 'v1.2-3-gabc1234', commit: 'abc1234' });
  });
});
