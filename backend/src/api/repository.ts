import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { Database } from './model.js';
import { fields, query, snapshotQueries, type Operation, type Query } from './domain.queries.js';
import { QueryRunner, type Executor } from './query-runner.js';
import { keys, schemas, tables, validate, type Row, type Table } from './schema.js';

function normalize<K extends Table>(table: K, input: Record<string, unknown>): Row<K> {
  const result: Record<string, unknown> = {};
  for (const [name, rule] of Object.entries(schemas[table])) {
    let value = input[name];
    if (value === undefined) throw new ServiceUnavailableException(`Contrato de retorno inválido: ${table}.${name}.`);
    if (value !== null && rule.kind === 'number') value = Number(value);
    if (value instanceof Date && rule.kind === 'date') {
      value = `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
    }
    result[name] = value;
  }
  try { return validate(table, result); }
  catch { throw new ServiceUnavailableException(`Tipos inválidos no retorno de ${table}.`); }
}
export class UnitOfWork {
  constructor(readonly db: Database, private readonly run: Executor) {}
  find<K extends Table>(table: K, key: Partial<Row<K>>): Row<K> | undefined {
    return (this.db[table] as Row<K>[]).find(row => keys[table].every(name => row[name as keyof Row<K>] === key[name as keyof Row<K>]));
  }
  require<K extends Table>(table: K, key: Partial<Row<K>>): Row<K> {
    const row = this.find(table, key);
    if (!row) throw new NotFoundException(`Registro não encontrado: ${table}.`);
    return row;
  }
  async write<K extends Table>(table: K, operation: Exclude<Operation, 'list'>, data: Partial<Row<K>>): Promise<Row<K>> {
    const result = await this.run(query(table, operation), fields(table, operation).map(name => data[name as keyof Row<K>]));
    if (result.rowCount !== 1 || result.rows.length !== 1) {
      throw new ServiceUnavailableException(`A consulta ${table}.${operation} deve afetar e retornar exatamente uma linha.`);
    }
    const row = normalize(table, result.rows[0]);
    const rows = this.db[table] as Row<K>[];
    const index = rows.findIndex(item => keys[table].every(name => item[name as keyof Row<K>] === row[name as keyof Row<K>]));
    if (operation === 'delete') { if (index >= 0) rows.splice(index, 1); }
    else if (index >= 0) rows[index] = row;
    else rows.push(row);
    return row;
  }
  execute(query: Query, params: unknown[]) { return this.run(query, params); }
  insert<K extends Table>(table: K, data: Partial<Row<K>>) { return this.write(table, 'insert', data); }
  update<K extends Table>(table: K, data: Row<K>) { this.require(table, data); return this.write(table, 'update', data); }
  remove<K extends Table>(table: K, data: Partial<Row<K>>) { this.require(table, data); return this.write(table, 'delete', data); }
  upsert<K extends Table>(table: K, data: Row<K>) { return this.find(table, data) ? this.update(table, data) : this.insert(table, data); }
}
export function writes(...entries: [Table, ...Exclude<Operation, 'list'>[]][]): Query[] {
  return entries.flatMap(([table, ...operations]) => operations.map(operation => query(table, operation)));
}
@Injectable()
export class DomainRepository {
  constructor(private readonly runner: QueryRunner) {}
  transaction<T>(queries: Query[], work: (context: UnitOfWork) => Promise<T>) {
    return this.runner.transaction([...snapshotQueries(), ...queries], async run => {
      const db = {} as Database;
      // Sequencial: mesmo cliente/transação e snapshot protegido pelo lock comum.
      for (const table of tables) {
        const result = await run(query(table, 'list'));
        (db[table] as unknown[]) = result.rows.map(row => normalize(table, row));
      }
      return work(new UnitOfWork(db, run));
    });
  }
  snapshot() { return this.transaction([], async context => context.db); }
}
