import { keys, schemas, tables, type Table } from './schema.js';

/** Preencha SOMENTE as strings vazias. Contratos detalhados: docs/SQL_BACKEND.md. */
export interface Query {
  id: string;
  sql: string;
  purpose: string;
  params: string[];
  returns: string;
}
export type Operation = 'list' | 'insert' | 'update' | 'delete';
// Cada propriedade corresponde a uma consulta independente, nunca SQL gerado.
export const sql: Record<Table, Record<Operation, string>> = {
  doador: { list: '', insert: '', update: '', delete: '' },
  abrigo: { list: '', insert: '', update: '', delete: '' },
  voluntario: { list: '', insert: '', update: '', delete: '' },
  veterinario: { list: '', insert: '', update: '', delete: '' },
  adotante: { list: '', insert: '', update: '', delete: '' },
  vacina: { list: '', insert: '', update: '', delete: '' },
  doacao: { list: '', insert: '', update: '', delete: '' },
  animal: { list: '', insert: '', update: '', delete: '' },
  prontuario: { list: '', insert: '', update: '', delete: '' },
  atendimento: { list: '', insert: '', update: '', delete: '' },
  pedido_adocao: { list: '', insert: '', update: '', delete: '' },
  feira_adocao: { list: '', insert: '', update: '', delete: '' },
  atua: { list: '', insert: '', update: '', delete: '' },
  vinculo: { list: '', insert: '', update: '', delete: '' },
  aplicacao: { list: '', insert: '', update: '', delete: '' },
  participa: { list: '', insert: '', update: '', delete: '' },
};
export function fields(table: Table, operation: Operation): string[] {
  if (operation === 'list') return [];
  if (operation === 'delete') return keys[table];
  const mutable = Object.keys(schemas[table]).filter(key => !keys[table].includes(key));
  if (operation === 'update') return [...mutable, ...keys[table]];
  return Object.keys(schemas[table]).filter(key => key !== 'id');
}
export function query(table: Table, operation: Operation): Query {
  const columns = Object.keys(schemas[table]);
  return {
    id: `${table}.${operation}`, sql: sql[table][operation],
    purpose: operation === 'list' ? `Ler TODAS as linhas de ${table}, ordenadas pela chave ${keys[table].join(', ')}; sem joins/filtros/limite.`
      : operation === 'delete' ? `Remover exatamente a linha de ${table} identificada por TODOS os componentes da chave; sem cascatas implícitas.`
      : `${operation === 'insert' ? 'Criar uma linha, gerando id quando SERIAL' : 'Atualizar todos os campos mutáveis de uma linha pela chave completa'} em ${table}.`,
    params: fields(table, operation).map((name, index) => `$${index + 1}: ${name} (${schemas[table][name].kind}${schemas[table][name].nullable ? ', nullable' : ''})`),
    returns: `${operation === 'list' ? '0..N' : 'exatamente 1'} linhas completas (${columns.join(', ')}). ${operation === 'list' ? '' : 'rowCount = 1, inclusive delete; devolver linha removida.'}`,
  };
}
export const snapshotQueries = () => tables.map(table => query(table, 'list'));
export const transactionQueries: Record<'begin' | 'commit' | 'rollback' | 'lock', Query> = {
  begin: { id: 'transaction.begin', sql: '', params: [], returns: 'Nenhuma linha.',
    purpose: 'Iniciar transação READ COMMITTED no cliente dedicado; snapshots seguintes devem enxergar o commit de quem liberou o lock.' },
  commit: { id: 'transaction.commit', sql: '', params: [], returns: 'Nenhuma linha.', purpose: 'Confirmar todas as alterações e liberar lock transacional.' },
  rollback: { id: 'transaction.rollback', sql: '', params: [], returns: 'Nenhuma linha.', purpose: 'Desfazer todas as alterações e liberar lock transacional.' },
  lock: { id: 'transaction.lock', sql: '', params: [], returns: 'Resultado ignorado.',
    purpose: 'Adquirir advisory lock transacional exclusivo com chave constante da aplicação. TODAS as escritas e snapshots usam este mesmo lock até commit/rollback; serializa decisões/capacidade/doses/vínculos, inclusive linhas ainda inexistentes.' },
};
