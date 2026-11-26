import { ConflictException, Injectable, InternalServerErrorException, NotImplementedException, ServiceUnavailableException } from '@nestjs/common';
import type { PoolClient, QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service.js';
import { type Query, transactionQueries as tx } from './domain.queries.js';

export function preflight(queries: Query[]) {
  const missing = [...new Set(queries.filter(query => !query.sql.trim()).map(query => query.id))];
  if (missing.length) throw new NotImplementedException({ code: 'SQL_NOT_IMPLEMENTED',
    message: 'As consultas desta operação ainda precisam ser implementadas.', queries: missing });
}
export function databaseError(error: unknown): never {
  const code = (error as { code?: string })?.code;
  if (['23505','23503','23514','40001','40P01'].includes(code ?? '')) {
    throw new ConflictException('Conflito de dados. Recarregue e confira vínculos e valores únicos.');
  }
  throw new ServiceUnavailableException('Não foi possível concluir a operação no banco de dados.');
}
@Injectable()
export class QueryRunner {
  constructor(private readonly database: DatabaseService) {}

  async transaction<T>(queries: Query[], work: (run: Executor) => Promise<T>): Promise<T> {
    preflight([...Object.values(tx), ...queries]);
    let client: PoolClient;
    try { client = await this.database.connect(); } catch (error) { return databaseError(error); }
    let begun = false;
    let discard = false;
    try {
      const run: Executor = async (query, params = []) => {
        preflight([query]);
        if (![...Object.values(tx), ...queries].some(allowed => allowed.id === query.id)) {
          throw new InternalServerErrorException(`Consulta não declarada na operação: ${query.id}`);
        }
        try { return await client.query(query.sql, params); } catch (error) { return databaseError(error); }
      };
      await run(tx.begin); begun = true;
      await run(tx.lock);
      const result = await work(run);
      await run(tx.commit); begun = false;
      return result;
    } catch (error) {
      if (begun) {
        try { await client.query(tx.rollback.sql); } catch { discard = true; }
      } else { discard = true; }
      throw error;
    } finally { client.release(discard); }
  }
}
export type Executor = (query: Query, values?: unknown[]) => Promise<{ rows: QueryResultRow[]; rowCount: number | null }>;
