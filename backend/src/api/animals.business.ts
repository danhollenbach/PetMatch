import { photoQueries } from './photo.queries.js';
import { BadRequestException } from '@nestjs/common';
import { check, capacity, noHistory, assertKeys } from './rules.js';
import { object, validate, past } from './schema.js';
import { type UnitOfWork, writes } from './repository.js';

export const animalWrites = writes(['animal','insert','update','delete'], ['prontuario','insert','update','delete']);
export const animalDeleteWrites = [...animalWrites, photoQueries.delete];
export async function saveAnimal(u: UnitOfWork, input: unknown, id?: number) {
  const body = object(input);
  assertKeys(body, ['animal','prontuario']);
  const data = validate('animal', body.animal, ['id']);
  const pront = validate('prontuario', body.prontuario, ['id','id_animal']);
  past(data.data_nascimento); past(pront.data_abertura);
  check(!data.data_nascimento || pront.data_abertura >= data.data_nascimento, 'Prontuário não pode preceder o nascimento.');
  const old = id === undefined ? undefined : u.require('animal', { id });
  if (old?.status === 'adotado') {
    check(data.status === 'adotado' && data.cnpj_abrigo === old.cnpj_abrigo, 'Adoção concluída não pode ser revertida ou transferida.');
  } else if (data.status === 'adotado') throw new BadRequestException('Adoção exige aprovação de pedido pendente.');
  u.require('abrigo', { cnpj: data.cnpj_abrigo });
  if (!old || old.cnpj_abrigo !== data.cnpj_abrigo) capacity(u, data.cnpj_abrigo, data.status === 'adotado' ? 0 : 1);
  if (old) {
    const record = u.db.prontuario.find(p => p.id_animal === old.id);
    check(record, 'Animal sem prontuário; corrija a integridade do banco.');
    const visits = u.db.atendimento.filter(a => a.id_prontuario === record.id);
    const applications = u.db.aplicacao.filter(a => a.id_prontuario === record.id);
    check(visits.every(a => a.data >= pront.data_abertura) && applications.every(a => a.data_aplicacao >= pront.data_abertura), 'Abertura posterior ao histórico clínico.');
    check(!visits.some(a => a.peso !== null) || pront.peso === record.peso, 'Peso é calculado pelos atendimentos com medição.');
    check(applications.every(a => {
      const vaccine = u.require('vacina', { id: a.id_vacina });
      return vaccine.especie_alvo === 'ambos' || vaccine.especie_alvo === data.especie;
    }), 'Espécie incompatível com o histórico de vacinação.');
    await u.update('prontuario', { ...pront, id: record.id, id_animal: old.id });
    return u.update('animal', { ...data, id: old.id });
  }
  const animal = await u.insert('animal', data);
  await u.insert('prontuario', { ...pront, id_animal: animal.id });
  return animal;
}
export async function deleteAnimal(u: UnitOfWork, id: number) {
  const animal = u.require('animal', { id });
  check(animal.status !== 'adotado', 'Não é permitido excluir animal adotado.');
  const record = noHistory(u, id);
  await u.execute(photoQueries.delete, [id]);
  if (record) await u.remove('prontuario', record);
  return u.remove('animal', animal);
}
export const shelterWrites = writes(['abrigo','insert','update'], ['voluntario','insert','update'], ['atua','insert']);
export async function registerShelter(u: UnitOfWork, input: unknown) {
  const body = object(input); assertKeys(body, ['abrigo','gestor']);
  const shelter = validate('abrigo', body.abrigo);
  const manager = validate('voluntario', body.gestor);
  check(!u.find('abrigo', shelter), 'CNPJ já cadastrado.');
  await u.insert('abrigo', shelter);
  await u.upsert('voluntario', manager);
  await u.insert('atua', { cnpj_abrigo: shelter.cnpj, cpf_voluntario: manager.cpf, funcao: 'Coordenação' });
  return shelter;
}
