import { describe, expect, it } from 'vitest';
import { fixture, animal, person, shelter, record } from '../../test/business.fixture.js';
import { saveAnimal, deleteAnimal, registerShelter } from './animals.business.js';
import { requestAdoption, decideAdoption } from './adoption.business.js';
import { saveSimple, deleteSimple, saveDonation } from './crud.business.js';
import { validate } from './schema.js';

const animalBody = () => { const { id: _id, ...data } = animal; const { id: _r, id_animal: _a, ...prontuario } = record; return { animal: data, prontuario }; };
const pending = { id: 1, id_animal: 1, cpf_adotante: person.cpf, status: 'pendente' as const, data_pedido: '2026-01-01', data_decisao: null };
describe('animais e abrigos', () => {
  it('cria animal e prontuário usando id devolvido pelo banco', async () => {
    const { u, db, run } = fixture();
    const created = await saveAnimal(u, animalBody());
    expect(created.id).toBe(2);
    expect(db.prontuario.find(p => p.id_animal === created.id)).toBeDefined();
    expect(run.mock.calls.map(([q]) => q.id)).toEqual(['animal.insert','prontuario.insert']);
  });
  it('bloqueia capacidade excedida sem escrever', async () => {
    const { u, run } = fixture({ abrigo: [{ ...shelter, capacidade: 1 }] });
    await expect(saveAnimal(u, animalBody())).rejects.toMatchObject({ status: 409 });
    expect(run).not.toHaveBeenCalled();
  });
  it('valida capacidade do abrigo de destino em transferência', async () => {
    const { u } = fixture({ abrigo: [shelter, { ...shelter, cnpj: '00000000000002', capacidade: 0 }] });
    const body = animalBody(); body.animal.cnpj_abrigo = '00000000000002';
    await expect(saveAnimal(u, body, 1)).rejects.toMatchObject({ status: 409 });
  });
  it('não permite adoção manual nem reversão de adoção', async () => {
    const { u } = fixture(); const body = animalBody();
    await expect(saveAnimal(u, { ...body, animal: { ...body.animal, status: 'adotado' } })).rejects.toMatchObject({ status: 400 });
    u.db.animal[0].status = 'adotado';
    await expect(saveAnimal(u, body, 1)).rejects.toMatchObject({ status: 409 });
  });
  it('só exclui animal sem histórico e remove prontuário junto', async () => {
    const { u, db } = fixture(); await deleteAnimal(u, 1);
    expect(db.animal).toEqual([]); expect(db.prontuario).toEqual([]);
    const other = fixture({ pedido_adocao: [pending] });
    await expect(deleteAnimal(other.u, 1)).rejects.toMatchObject({ status: 409 });
  });
  it('registra abrigo, coordenador e vínculo', async () => {
    const { u, db } = fixture({ abrigo: [] });
    await registerShelter(u, { abrigo: shelter, gestor: person });
    expect(db.atua).toEqual([{ cnpj_abrigo: shelter.cnpj, cpf_voluntario: person.cpf, funcao: 'Coordenação' }]);
    await expect(registerShelter(u, { abrigo: shelter, gestor: person })).rejects.toMatchObject({ status: 409 });
  });
  it('recusa redução de capacidade abaixo da ocupação', async () => {
    const { u } = fixture();
    await expect(saveSimple(u, 'abrigo', { ...shelter, capacidade: 0 }, shelter)).rejects.toMatchObject({ status: 409 });
  });
});
describe('adoção', () => {
  it('abre pedido pendente com datas controladas pelo servidor', async () => {
    const { u, db } = fixture(); await requestAdoption(u, { adotante: person, id_animal: 1 });
    expect(db.pedido_adocao[0]).toMatchObject({ status: 'pendente', data_decisao: null });
    expect(db.adotante).toHaveLength(1);
    await expect(requestAdoption(u, { adotante: person, id_animal: 1 })).rejects.toMatchObject({ status: 409 });
  });
  it.each(['reservado','em_tratamento','adotado'] as const)('recusa pedido para animal %s', async status => {
    const { u, run } = fixture({ animal: [{ ...animal, status }] });
    await expect(requestAdoption(u, { adotante: person, id_animal: 1 })).rejects.toMatchObject({ status: 409 });
    expect(run).not.toHaveBeenCalled();
  });
  it('recusa email de outro CPF', async () => {
    const { u } = fixture({ adotante: [{ ...person, cpf: '00000000002' }] });
    await expect(requestAdoption(u, { adotante: { ...person, email: person.email.toUpperCase() }, id_animal: 1 })).rejects.toMatchObject({ status: 409 });
  });
  it('aprova um pedido, adota animal, rejeita concorrentes e impede nova decisão', async () => {
    const { u, db } = fixture({ pedido_adocao: [pending, { ...pending, id: 2, cpf_adotante: '00000000002' }] });
    await decideAdoption(u, 1, { decisao: 'aprovado' });
    expect(db.animal[0].status).toBe('adotado');
    expect(db.pedido_adocao.map(p => p.status)).toEqual(['aprovado','reprovado']);
    await expect(decideAdoption(u, 2, { decisao: 'aprovado' })).rejects.toMatchObject({ status: 409 });
    await expect(decideAdoption(u, 1, { decisao: 'reprovado' })).rejects.toMatchObject({ status: 409 });
  });
  it('reprovar não altera disponibilidade do animal', async () => {
    const { u, db } = fixture({ pedido_adocao: [pending] });
    await decideAdoption(u, 1, { decisao: 'reprovado' });
    expect(db.animal[0].status).toBe('disponivel');
  });
});
describe('validações e doações', () => {
  it('aceita doação anônima e recusa dinheiro sem valor', async () => {
    const { u, db } = fixture();
    const doacao = { cnpj_abrigo: shelter.cnpj, data: '2026-01-02', tipo: 'dinheiro', valor: 10, descricao: null };
    await saveDonation(u, { doacao, doador: null });
    expect(db.doacao[0].documento_doador).toBeNull();
    await expect(saveDonation(u, { doacao: { ...doacao, valor: null }, doador: null })).rejects.toMatchObject({ status: 409 });
  });
  it('bloqueia exclusão de doador referenciado', () => {
    const { u } = fixture({ doador: [{ ...person, documento: person.cpf }], doacao: [{ id: 1, cnpj_abrigo: shelter.cnpj, documento_doador: person.cpf, valor: 10, descricao: null, data: '2026-01-02', tipo: 'dinheiro' }] });
    expect(() => deleteSimple(u, 'doador', { documento: person.cpf })).toThrow();
  });
  it.each(['2026-02-30','ontem','2026-13-01'])('recusa data inválida %s', data => {
    expect(() => validate('feira_adocao', { cnpj_abrigo: shelter.cnpj, nome: 'Feira', logradouro: 'Rua', data }, ['id'])).toThrow();
  });
  it('preserva documentos com zeros e recusa campos desconhecidos', () => {
    expect(validate('adotante', person).cpf).toBe('00000000001');
    expect(() => validate('adotante', { ...person, administrador: true })).toThrow();
    expect(() => validate('adotante', { ...person, cpf: 1 })).toThrow();
  });
});
