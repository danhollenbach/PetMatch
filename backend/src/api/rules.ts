import { BadRequestException, ConflictException } from '@nestjs/common';
import type { Database } from './model.js';
import type { UnitOfWork } from './repository.js';
import type { Row, Table } from './schema.js';

export function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ConflictException(message);
}
export function capacity(u: UnitOfWork, cnpj: string, extra = 0) {
  const shelter = u.require('abrigo', { cnpj });
  const occupancy = u.db.animal.filter(a => a.cnpj_abrigo === cnpj && a.status !== 'adotado').length;
  check(occupancy + extra <= shelter.capacidade, 'O abrigo não possui capacidade disponível.');
}
export function unique<K extends Table>(db: Database, table: K, field: keyof Row<K>, value: unknown, same: (row: Row<K>) => boolean) {
  const normalized = String(value).toLocaleLowerCase();
  check(!(db[table] as Row<K>[]).some(row => String(row[field]).toLocaleLowerCase() === normalized && !same(row)), `Valor já cadastrado: ${String(field)}.`);
}
export function id(value: string) {
  const result = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(result) || result < 1 || result > 2147483647) throw new BadRequestException('Identificador inválido.');
  return result;
}
export function recordAnimal(u: UnitOfWork, id_prontuario: number) {
  const record = u.require('prontuario', { id: id_prontuario });
  return { record, animal: u.require('animal', { id: record.id_animal }) };
}
export function noHistory(u: UnitOfWork, id_animal: number) {
  const record = u.db.prontuario.find(p => p.id_animal === id_animal);
  check(!u.db.pedido_adocao.some(p => p.id_animal === id_animal), 'Animal possui histórico de adoção.');
  check(!record || (!u.db.atendimento.some(a => a.id_prontuario === record.id) && !u.db.aplicacao.some(a => a.id_prontuario === record.id)), 'Animal possui histórico clínico.');
  return record;
}
export function assertKeys(input: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(input).some(key => !allowed.includes(key))) throw new BadRequestException('Campo desconhecido ou controlado pelo servidor.');
}
