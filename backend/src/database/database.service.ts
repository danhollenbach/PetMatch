import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@Inject(Pool) private readonly pool: Pool) {}

  async onModuleInit(): Promise<void> {
    await this.query('SELECT 1');
    this.logger.log('Conexão com PostgreSQL estabelecida.');
  }

  query<Row extends QueryResultRow = QueryResultRow>(
    sql: string,
    values: unknown[] = [],
  ): Promise<QueryResult<Row>> {
    return this.pool.query<Row>(sql, values);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
