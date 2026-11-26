import { check, unique, assertKeys } from './rules.js';
import { object, validate, today } from './schema.js';
import { type UnitOfWork, writes } from './repository.js';

export const adoptionWrites = writes(['adotante','insert','update'], ['pedido_adocao','insert','update'], ['animal','update']);
export async function requestAdoption(u: UnitOfWork, input: unknown) {
  const body = object(input); assertKeys(body, ['adotante','id_animal']);
  const adopter = validate('adotante', body.adotante);
  const request = validate('pedido_adocao', { id_animal: body.id_animal, cpf_adotante: adopter.cpf,
    status: 'pendente', data_pedido: today(), data_decisao: null }, ['id']);
  const animal = u.require('animal', { id: request.id_animal });
  check(animal.status === 'disponivel', 'Animal indisponível para adoção.');
  check(!u.db.pedido_adocao.some(p => p.id_animal === animal.id && p.cpf_adotante === adopter.cpf && p.status === 'pendente'), 'Já existe pedido pendente deste adotante para o animal.');
  unique(u.db, 'adotante', 'email', adopter.email, a => a.cpf === adopter.cpf);
  await u.upsert('adotante', adopter);
  return u.insert('pedido_adocao', request);
}
export async function decideAdoption(u: UnitOfWork, id: number, input: unknown) {
  const body = object(input); assertKeys(body, ['decisao']);
  const value = validate('pedido_adocao', { status: body.decisao }, ['id','id_animal','cpf_adotante','data_pedido','data_decisao']);
  check(value.status !== 'pendente', 'Informe aprovado ou reprovado.');
  const request = u.require('pedido_adocao', { id });
  check(request.status === 'pendente', 'Decisões finais são imutáveis.');
  check(request.data_pedido <= today(), 'Data do pedido está no futuro.');
  const animal = u.require('animal', { id: request.id_animal });
  if (value.status === 'aprovado') {
    check(animal.status === 'disponivel', 'Animal indisponível para adoção.');
    await u.update('animal', { ...animal, status: 'adotado' });
    for (const other of [...u.db.pedido_adocao]) {
      if (other.id !== id && other.id_animal === animal.id && other.status === 'pendente') {
        await u.update('pedido_adocao', { ...other, status: 'reprovado', data_decisao: today() });
      }
    }
  }
  return u.update('pedido_adocao', { ...request, status: value.status, data_decisao: today() });
}
