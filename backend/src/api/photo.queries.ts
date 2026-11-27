import type { Query } from './domain.queries.js';
export const photoQueries: Record<'get' | 'save' | 'delete', Query> = {
  get: { id: 'foto.get', sql: '', params: ['$1: id_animal (integer)'],
    purpose: 'Buscar a única foto do animal na futura tabela de binários; sem codificar em base64.',
    returns: '0..1 linha: id_animal integer, dados Buffer BYTEA, mime image/jpeg ou image/png, nome string.' },
  save: { id: 'foto.save', sql: '', params: ['$1: id_animal (integer)', '$2: dados (Buffer)', '$3: mime (string)', '$4: nome (string)'],
    purpose: 'Inserir ou substituir atomicamente a única foto do animal, preservando os bytes no PostgreSQL.',
    returns: 'rowCount = 1; exatamente 1 linha: id_animal integer. Não devolver os bytes.' },
  delete: { id: 'foto.delete', sql: '', params: ['$1: id_animal (integer)'],
    purpose: 'Remover a foto do animal; operação idempotente, também chamada antes da exclusão do animal.',
    returns: 'rowCount 0 ou 1; não exige linhas retornadas.' },
};
