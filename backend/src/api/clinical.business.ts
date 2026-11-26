import { check, unique, recordAnimal, assertKeys } from './rules.js';
import { object, validate, past } from './schema.js';
import { type UnitOfWork, writes } from './repository.js';
import type { Aplicacao } from './model.js';

export const clinicalWrites = writes(['atendimento','insert','update','delete'], ['prontuario','update']);
export async function refreshWeight(u: UnitOfWork, id: number) {
  const record = u.require('prontuario', { id });
  const latest = u.db.atendimento.filter(a => a.id_prontuario === id && a.peso !== null)
    .sort((a,b) => b.data.localeCompare(a.data) || b.id - a.id)[0];
  // Sem medições restantes, não há fonte histórica para o peso atual.
  await u.update('prontuario', { ...record, peso: latest?.peso ?? null });
}
export async function saveVisit(u: UnitOfWork, input: unknown, id?: number) {
  const data = validate('atendimento', input, ['id']); past(data.data);
  const { record, animal } = recordAnimal(u, data.id_prontuario);
  check(data.data >= record.data_abertura, 'Atendimento anterior à abertura do prontuário.');
  u.require('veterinario', { cpf: data.cpf_veterinario });
  check(u.db.vinculo.some(v => v.cpf_veterinario === data.cpf_veterinario && v.cnpj_abrigo === animal.cnpj_abrigo), 'Veterinário não vinculado ao abrigo do animal.');
  const old = id === undefined ? undefined : u.require('atendimento', { id });
  check(!old || old.id_prontuario === data.id_prontuario, 'Não é permitido transferir atendimento para outro prontuário.');
  const visit = old ? await u.update('atendimento', { ...data, id: old.id }) : await u.insert('atendimento', data);
  await refreshWeight(u, record.id);
  return visit;
}
export async function deleteVisit(u: UnitOfWork, id: number) {
  const old = await u.remove('atendimento', { id });
  await refreshWeight(u, old.id_prontuario);
  return old;
}
export const applicationWrites = writes(['aplicacao','insert','update','delete'], ['vacina','insert']);
export async function saveApplication(u: UnitOfWork, input: unknown, oldKey?: Aplicacao) {
  const body = object(input); assertKeys(body, ['aplicacao','novaVacina']);
  const raw = object(body.aplicacao);
  const newVaccine = body.novaVacina == null ? null : validate('vacina', body.novaVacina, ['id']);
  check(!(newVaccine && raw.id_vacina != null), 'Informe vacina existente ou nova, nunca ambas.');
  const data = validate('aplicacao', newVaccine ? { ...raw, id_vacina: 1 } : raw);
  past(data.data_aplicacao);
  const { record, animal } = recordAnimal(u, data.id_prontuario);
  check(data.data_aplicacao >= record.data_abertura, 'Aplicação anterior à abertura do prontuário.');
  if (newVaccine) unique(u.db, 'vacina', 'nome', newVaccine.nome, () => false);
  const vaccine = newVaccine ?? u.require('vacina', { id: data.id_vacina });
  check(vaccine.especie_alvo === 'ambos' || vaccine.especie_alvo === animal.especie, 'Vacina incompatível com a espécie.');
  if (oldKey) {
    check(!newVaccine && oldKey.id_vacina === data.id_vacina && oldKey.id_prontuario === data.id_prontuario && oldKey.dose === data.dose, 'Chave da aplicação é imutável.');
    return u.update('aplicacao', data);
  }
  if (newVaccine) data.id_vacina = (await u.insert('vacina', newVaccine)).id;
  check(!u.find('aplicacao', data), 'Esta dose da vacina já foi registrada.');
  return u.insert('aplicacao', data);
}
