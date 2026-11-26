import { describe, expect, it, vi, afterEach } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { QueryRunner, preflight } from './query-runner.js';
import { transactionQueries as tx, query, sql } from './domain.queries.js';
import type { DatabaseService } from '../database/database.service.js';

const originals = Object.fromEntries(Object.entries(tx).map(([key, value]) => [key, value.sql]));
afterEach(() => { for (const [key, value] of Object.entries(tx)) value.sql = originals[key]; });
function setup() {
  // Sentinelas não são SQL e nunca saem do cliente simulado.
  for (const value of Object.values(tx)) value.sql = value.id;
  const client = { query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }), release: vi.fn() };
  const database = { connect: vi.fn().mockResolvedValue(client) };
  return { client, database, runner: new QueryRunner(database as unknown as DatabaseService) };
}
describe('executor transacional', () => {
  it('mantém todas as consultas de domínio vazias', () => {
    expect(Object.values(sql).flatMap(Object.values).every(value => value === '')).toBe(true);
  });
  it('retorna 501 com todos os identificadores pendentes', () => {
    try { preflight([query('animal','insert'), query('prontuario','insert')]); }
    catch (error) { expect((error as { getResponse(): unknown }).getResponse()).toMatchObject({ code: 'SQL_NOT_IMPLEMENTED', queries: ['animal.insert','prontuario.insert'] }); }
  });
  it('não conecta nem altera nada se falta query de escrita', async () => {
    const { runner, database } = setup();
    const work = vi.fn();
    await expect(runner.transaction([query('animal','insert')], work)).rejects.toMatchObject({ status: 501 });
    expect(database.connect).not.toHaveBeenCalled(); expect(work).not.toHaveBeenCalled();
  });
  it.each(['begin','commit','rollback','lock'] as const)('exige infraestrutura %s antes de conectar', async name => {
    const { runner, database } = setup(); tx[name].sql = '';
    await expect(runner.transaction([], async () => true)).rejects.toMatchObject({ status: 501 });
    expect(database.connect).not.toHaveBeenCalled();
  });
  it('executa começo, bloqueio e confirmação no mesmo cliente', async () => {
    const { runner, client } = setup();
    await expect(runner.transaction([], async () => 7)).resolves.toBe(7);
    expect(client.query.mock.calls.map(args => args[0])).toEqual(['transaction.begin','transaction.lock','transaction.commit']);
    expect(client.release).toHaveBeenCalledWith(false);
  });
  it('faz rollback e preserva erro de negócio', async () => {
    const { runner, client } = setup(); const error = new ConflictException('Lotado');
    await expect(runner.transaction([], async () => { throw error; })).rejects.toBe(error);
    expect(client.query).toHaveBeenLastCalledWith('transaction.rollback');
    expect(client.release).toHaveBeenCalledWith(false);
  });
  it('descarta cliente se rollback falhar sem ocultar erro original', async () => {
    const { runner, client } = setup(); const error = new Error('negócio');
    client.query.mockImplementation(async (value: string) => { if (value === 'transaction.rollback') throw new Error('conexão'); return { rows: [], rowCount: 0 }; });
    await expect(runner.transaction([], async () => { throw error; })).rejects.toBe(error);
    expect(client.release).toHaveBeenCalledWith(true);
  });
  it('mapeia indisponibilidade de conexão para 503', async () => {
    const { runner, database } = setup(); database.connect.mockRejectedValue(new Error('senha sensível'));
    await expect(runner.transaction([], async () => true)).rejects.toMatchObject({ status: 503 });
  });
  it('recusa query não declarada e reverte', async () => {
    const { runner, client } = setup();
    await expect(runner.transaction([], run => run({ ...query('animal','insert'), sql: 'sentinela' }))).rejects.toMatchObject({ status: 500 });
    expect(client.query).toHaveBeenLastCalledWith('transaction.rollback');
  });
});
