import { check, unique, assertKeys } from './rules.js';
import { object, validate } from './schema.js';
import { type UnitOfWork, writes } from './repository.js';

export const teamWrites = writes(['voluntario','insert','update'], ['veterinario','insert','update'],
  ['atua','insert','update','delete'], ['vinculo','insert','delete'], ['participa','delete']);
export async function saveTeam(u: UnitOfWork, cnpj: string, kind: 'voluntario' | 'veterinario', input: unknown) {
  u.require('abrigo', { cnpj });
  const body = object(input);
  assertKeys(body, kind === 'voluntario' ? ['pessoa','funcao'] : ['pessoa']);
  if (kind === 'voluntario') {
    const person = validate('voluntario', body.pessoa);
    const link = validate('atua', { cnpj_abrigo: cnpj, cpf_voluntario: person.cpf, funcao: body.funcao });
    await u.upsert('voluntario', person);
    return u.upsert('atua', link);
  }
  const person = validate('veterinario', body.pessoa);
  unique(u.db, 'veterinario', 'crmv', person.crmv, v => v.cpf === person.cpf);
  await u.upsert('veterinario', person);
  const link = { cnpj_abrigo: cnpj, cpf_veterinario: person.cpf };
  return u.find('vinculo', link) ?? u.insert('vinculo', link);
}
export async function unlinkTeam(u: UnitOfWork, cnpj: string, cpf: string, kind: 'voluntario' | 'veterinario') {
  u.require('abrigo', { cnpj });
  if (kind === 'veterinario') return u.remove('vinculo', { cnpj_abrigo: cnpj, cpf_veterinario: cpf });
  const fairs = new Set(u.db.feira_adocao.filter(f => f.cnpj_abrigo === cnpj).map(f => f.id));
  for (const participation of [...u.db.participa]) {
    if (participation.cpf_voluntario === cpf && fairs.has(participation.id_feira_adocao)) await u.remove('participa', participation);
  }
  return u.remove('atua', { cnpj_abrigo: cnpj, cpf_voluntario: cpf });
}
export const fairWrites = writes(['feira_adocao','insert','update','delete'], ['participa','insert','delete']);
export async function saveFair(u: UnitOfWork, input: unknown, id?: number) {
  const body = object(input); assertKeys(body, ['feira','participantes']);
  const fair = validate('feira_adocao', body.feira, ['id']);
  u.require('abrigo', { cnpj: fair.cnpj_abrigo });
  check(Array.isArray(body.participantes), 'Informe a lista de participantes.');
  const cpfs = body.participantes as unknown[];
  check(new Set(cpfs).size === cpfs.length, 'Participante duplicado.');
  for (const cpf of cpfs) {
    const key = validate('atua', { cnpj_abrigo: fair.cnpj_abrigo, cpf_voluntario: cpf }, ['funcao']);
    check(u.find('atua', key), 'Participantes devem pertencer à equipe do abrigo.');
  }
  const saved = id === undefined ? await u.insert('feira_adocao', fair) : await u.update('feira_adocao', { ...fair, id });
  for (const p of [...u.db.participa]) if (p.id_feira_adocao === saved.id) await u.remove('participa', p);
  for (const cpf of cpfs) await u.insert('participa', { id_feira_adocao: saved.id, cpf_voluntario: cpf as string });
  return saved;
}
export async function deleteFair(u: UnitOfWork, id: number) {
  u.require('feira_adocao', { id });
  for (const p of [...u.db.participa]) if (p.id_feira_adocao === id) await u.remove('participa', p);
  return u.remove('feira_adocao', { id });
}
