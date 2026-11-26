import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DomainController } from './domain.controller.js';
import { PhotoController } from './photo.controller.js';
import { DomainService } from './domain.service.js';
import { DomainRepository } from './repository.js';
import { QueryRunner } from './query-runner.js';
import { DatabaseService } from '../database/database.service.js';
import { person, shelter } from '../../test/business.fixture.js';

describe('contrato HTTP sem consultas SQL', () => {
  let app: INestApplication;
  const database = { connect: vi.fn() };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [DomainController, PhotoController],
      providers: [DomainService, DomainRepository, QueryRunner, { provide: DatabaseService, useValue: database }] }).compile();
    app = module.createNestApplication(); await app.init();
  });
  afterAll(async () => { await app?.close(); });
  it('snapshot informa todas as pendências e não usa o pool', async () => {
    const response = await request(app.getHttpServer()).get('/api/dados').expect(501);
    expect(response.body.code).toBe('SQL_NOT_IMPLEMENTED');
    expect(response.body.queries).toEqual(expect.arrayContaining(['animal.list','transaction.rollback','transaction.lock']));
    expect(database.connect).not.toHaveBeenCalled();
  });
  it('cadastro válido responde 501 sem simular sucesso', async () => {
    const response = await request(app.getHttpServer()).post('/api/abrigos').send({ abrigo: shelter, gestor: person }).expect(501);
    expect(response.body.queries).toEqual(expect.arrayContaining(['abrigo.insert','voluntario.insert','atua.insert']));
  });
  it('entrada inválida é 400 antes de qualquer consulta', async () => {
    await request(app.getHttpServer()).post('/api/abrigos').send({}).expect(400);
    await request(app.getHttpServer()).get('/api/animais/xyz').expect(400);
    await request(app.getHttpServer()).post('/api/pedidos-adocao/1/decisao').send({ decisao: 'pendente' }).expect(400);
  });
  it('recursos desconhecidos e endpoints antigos são 404', async () => {
    await request(app.getHttpServer()).get('/api/inexistente').expect(404);
    await request(app.getHttpServer()).get('/api/toString').expect(404);
    await request(app.getHttpServer()).get('/animals').expect(404);
  });
  it('não permite alterar pedido via CRUD nem apagar prontuário isolado', async () => {
    await request(app.getHttpServer()).put('/api/pedidos-adocao/1').send({ status: 'aprovado' }).expect(400);
    await request(app.getHttpServer()).delete('/api/prontuarios/1').expect(400);
  });
  it('valida arquivo e retorna query id quando foto válida aguarda SQL', async () => {
    await request(app.getHttpServer()).put('/api/animais/1/foto').attach('foto', Buffer.from('texto'), { filename: 'foto.png', contentType: 'image/png' }).expect(400);
    const response = await request(app.getHttpServer()).put('/api/animais/1/foto')
      .attach('foto', Buffer.from([137,80,78,71,13,10,26,10]), { filename: 'foto.png', contentType: 'image/png' }).expect(501);
    expect(response.body.queries).toContain('foto.save');
  });
});
