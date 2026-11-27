import { vi } from 'vitest';
import { UnitOfWork } from '../src/api/repository.js';
import { fields } from '../src/api/domain.queries.js';
import type { Operation, Query } from '../src/api/domain.queries.js';
import { keys, tables, type Table } from '../src/api/schema.js';
import type { Database } from '../src/api/model.js';

export const shelter = { cnpj: '00000000000001', nome: 'Abrigo', telefone: '61999999999', capacidade: 3, logradouro: 'Rua A', cep: null, uf: 'DF', cidade: 'Brasília' };
export const person = { cpf: '00000000001', nome: 'Pessoa', email: 'pessoa@example.com', telefone: '61999999999' };
export const animal = { id: 1, cnpj_abrigo: shelter.cnpj, nome: 'Luna', sexo: 'F' as const, especie: 'gato' as const, raca: 'SRD', status: 'disponivel' as const, castrado: true, data_nascimento: null };
export const record = { id: 1, id_animal: 1, data_abertura: '2026-01-01', alergias: null, observacoes: null, peso: null };
export function fixture(extra: Partial<Database> = {}) {
  const db = Object.fromEntries(tables.map(table => [table, []])) as unknown as Database;
  Object.assign(db, structuredClone({ abrigo: [shelter], animal: [animal], prontuario: [record], ...extra }));
  const run = vi.fn(async (query: Query, params: unknown[] = []) => {
    if (query.id === 'foto.delete') return { rows: [], rowCount: 0 };
    const [table, operation] = query.id.split('.') as [Table, Operation];
    const data = Object.fromEntries(fields(table, operation).map((field, i) => [field, params[i]]));
    if (operation === 'delete') {
      const old = (db[table] as unknown as Record<string, unknown>[]).find(row => keys[table].every(k => row[k] === data[k]));
      return { rows: old ? [old] : [], rowCount: old ? 1 : 0 };
    }
    if (operation === 'insert' && keys[table][0] === 'id') data.id = Math.max(0, ...(db[table] as { id: number }[]).map(r => r.id)) + 1;
    return { rows: [data], rowCount: 1 };
  });
  return { u: new UnitOfWork(db, run), db, run };
}
