import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DatabaseService } from './../src/database/database.service.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health/database consulta o PostgreSQL real', () => {
    return request(app.getHttpServer())
      .get('/health/database')
      .expect(200)
      .expect({ status: 'ok', database: 'up' });
  });

  it('preserva parâmetros como dados, inclusive texto parecido com SQL', async () => {
    const value = "'; DROP TABLE animal; --";
    const result = await app
      .get(DatabaseService)
      .query<{ value: string }>('SELECT $1::text AS value', [value]);
    expect(result.rows).toEqual([{ value }]);
  });

  it('acessa as tabelas do esquema inicial pelo backend', async () => {
    const result = await app.get(DatabaseService).query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    );
    const names = result.rows.map((row) => row.table_name);
    expect(names).toEqual(
      expect.arrayContaining([
        'abrigo',
        'adotante',
        'animal',
        'aplicacao',
        'atendimento',
        'atua',
        'doacao',
        'doador',
        'feira_adocao',
        'participa',
        'pedido_adocao',
        'prontuario',
        'vacina',
        'veterinario',
        'vinculo',
        'voluntario',
      ]),
    );
  });

  afterAll(async () => {
    await app?.close();
  });
});
