import { BadRequestException } from '@nestjs/common';
import { check, unique, capacity, assertKeys } from './rules.js';
import { keys, object, past, validate, type Row, type Table } from './schema.js';
import { type UnitOfWork, writes } from './repository.js';
import { saveAnimal } from './animals.business.js';

export const donationWrites = writes(['doacao','insert','update'], ['doador','insert','update']);
export async function saveDonation(u: UnitOfWork, input: unknown, id?: number) {
  const body = object(input); assertKeys(body, ['doacao','doador']);
  const donor = body.doador == null ? null : validate('doador', body.doador);
  const raw = object(body.doacao);
  assertKeys(raw, ['cnpj_abrigo','valor','descricao','data','tipo']);
  const data = validate('doacao', { ...raw, documento_doador: donor?.documento ?? null }, ['id']);
  past(data.data);
  u.require('abrigo', { cnpj: data.cnpj_abrigo });
  check(data.tipo === 'dinheiro' ? data.valor !== null : data.descricao !== null && data.valor === null, 'Dinheiro exige valor positivo; insumo exige descrição e valor nulo.');
  if (id !== undefined) u.require('doacao', { id });
  if (donor) await u.upsert('doador', donor);
  return id === undefined ? u.insert('doacao', data) : u.update('doacao', { ...data, id });
}
export async function saveSimple<K extends Table>(u: UnitOfWork, table: K, input: unknown, key?: Partial<Row<K>>) {
  if (['animal','pedido_adocao','atendimento','doacao','feira_adocao','atua','vinculo','aplicacao','participa'].includes(table)) {
    throw new BadRequestException('Utilize a operação de negócio específica.');
  }
  const old = key ? u.require(table, key) : undefined;
  const data = validate(table, input, !key && keys[table][0] === 'id' ? ['id'] : []);
  if (old) check(keys[table].every(k => old[k as keyof Row<K>] === data[k as keyof Row<K>]), 'Chave primária é imutável.');
  else check(!u.find(table, data), 'Registro já cadastrado.');
  if (table === 'abrigo') {
    check(old, 'Cadastre abrigo junto com o coordenador.');
    const shelter = data as Row<'abrigo'>;
    const current = u.require('abrigo', { cnpj: shelter.cnpj });
    const previousCapacity = current.capacidade;
    current.capacidade = shelter.capacidade;
    try { capacity(u, shelter.cnpj); } finally { current.capacidade = previousCapacity; }
  }
  if (table === 'adotante') {
    const adopter = data as Row<'adotante'>;
    unique(u.db, 'adotante', 'email', adopter.email, a => a.cpf === adopter.cpf);
  }
  if (table === 'veterinario') {
    const vet = data as Row<'veterinario'>;
    unique(u.db, 'veterinario', 'crmv', vet.crmv, v => v.cpf === vet.cpf);
  }
  if (table === 'vacina') {
    const vaccine = data as Row<'vacina'>;
    unique(u.db, 'vacina', 'nome', vaccine.nome, v => v.id === vaccine.id);
    for (const ap of u.db.aplicacao.filter(a => a.id_vacina === vaccine.id)) {
      const record = u.require('prontuario', { id: ap.id_prontuario });
      const animal = u.require('animal', { id: record.id_animal });
      check(vaccine.especie_alvo === 'ambos' || vaccine.especie_alvo === animal.especie, 'Espécie incompatível com aplicações existentes.');
    }
  }
  if (table === 'prontuario') {
    check(old, 'Prontuário é criado junto com o animal.');
    const record = data as Row<'prontuario'>;
    check((old as Row<'prontuario'>).id_animal === record.id_animal, 'Prontuário não pode ser transferido.');
    const { id: animalId, ...animal } = u.require('animal', { id: record.id_animal });
    const { id: _id, id_animal: _animal, ...prontuario } = record;
    await saveAnimal(u, { animal, prontuario }, animalId);
    return u.require('prontuario', { id: record.id }) as Row<K>;
  }
  return old ? u.update(table, data) : u.insert(table, data);
}
// Dependências históricas não são apagadas silenciosamente por CRUD genérico.
const references: Partial<Record<Table, [Table, string, string][]>> = {
  abrigo: [['animal','cnpj_abrigo','cnpj'],['doacao','cnpj_abrigo','cnpj'],['feira_adocao','cnpj_abrigo','cnpj'],['atua','cnpj_abrigo','cnpj'],['vinculo','cnpj_abrigo','cnpj']],
  voluntario: [['atua','cpf_voluntario','cpf'],['participa','cpf_voluntario','cpf']],
  veterinario: [['vinculo','cpf_veterinario','cpf'],['atendimento','cpf_veterinario','cpf']],
  adotante: [['pedido_adocao','cpf_adotante','cpf']], doador: [['doacao','documento_doador','documento']],
  vacina: [['aplicacao','id_vacina','id']],
};
export function deleteSimple<K extends Table>(u: UnitOfWork, table: K, key: Partial<Row<K>>) {
  const old = u.require(table, key);
  check(table !== 'prontuario', 'Prontuário só pode ser excluído junto ao animal sem histórico.');
  check(table !== 'pedido_adocao', 'Pedidos devem ser decididos e preservados como histórico.');
  for (const [child, foreign, primary] of references[table] ?? []) {
    check(!(u.db[child] as unknown as Record<string, unknown>[]).some(r => r[foreign] === old[primary as keyof Row<K>]), `Registro referenciado em ${child}.`);
  }
  return u.remove(table, key);
}
