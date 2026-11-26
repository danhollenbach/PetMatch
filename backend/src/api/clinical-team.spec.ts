import { describe, expect, it } from 'vitest';
import { fixture, animal, person, shelter, record } from '../../test/business.fixture.js';
import { saveVisit, deleteVisit, saveApplication } from './clinical.business.js';
import { saveTeam, unlinkTeam, saveFair, deleteFair } from './team.business.js';
import { validatePhoto } from './photo.controller.js';
import { saveSimple } from './crud.business.js';

const vet = { ...person, crmv: 'DF-123' };
const linked = { veterinario: [vet], vinculo: [{ cpf_veterinario: vet.cpf, cnpj_abrigo: shelter.cnpj }] };
const visit = { cpf_veterinario: vet.cpf, id_prontuario: record.id, data: '2026-02-01', diagnostico: 'Saudável', tratamento: null, tipo: 'consulta' as const, peso: 3 };
const vaccine = { id: 1, nome: 'V1', especie_alvo: 'gato' as const };
const application = { id_prontuario: record.id, id_vacina: 1, dose: 1, data_aplicacao: '2026-02-01', lote: 'A' };
describe('histórico clínico', () => {
  it('exige veterinário vinculado e data após abertura', async () => {
    const { u } = fixture({ veterinario: [vet] });
    await expect(saveVisit(u, visit)).rejects.toMatchObject({ status: 409 });
    const linkedContext = fixture(linked);
    await expect(saveVisit(linkedContext.u, { ...visit, data: '2025-12-31' })).rejects.toMatchObject({ status: 409 });
  });
  it('usa medição mais recente e recalcula ao corrigir/excluir', async () => {
    const { u, db } = fixture(linked);
    await saveVisit(u, { ...visit, data: '2026-03-01', peso: 4 });
    await saveVisit(u, visit);
    expect(db.prontuario[0].peso).toBe(4);
    await saveVisit(u, { ...visit, data: '2026-04-01', peso: 5 }, 2);
    expect(db.prontuario[0].peso).toBe(5);
    await deleteVisit(u, 2); expect(db.prontuario[0].peso).toBe(4);
    await deleteVisit(u, 1); expect(db.prontuario[0].peso).toBeNull();
  });
  it('desempata medições da mesma data pelo id', async () => {
    const { u, db } = fixture(linked);
    await saveVisit(u, visit); await saveVisit(u, { ...visit, peso: 4 });
    expect(db.prontuario[0].peso).toBe(4);
  });
  it('recusa peso com precisão inválida e data futura', async () => {
    const { u } = fixture(linked);
    await expect(saveVisit(u, { ...visit, peso: 1.001 })).rejects.toMatchObject({ status: 400 });
    await expect(saveVisit(u, { ...visit, data: '2099-01-01' })).rejects.toMatchObject({ status: 400 });
  });
  it('não transfere atendimento de prontuário', async () => {
    const { u } = fixture({ ...linked, animal: [animal, { ...animal, id: 2 }], prontuario: [record, { ...record, id: 2, id_animal: 2 }], atendimento: [{ ...visit, id: 1 }] });
    await expect(saveVisit(u, { ...visit, id_prontuario: 2 }, 1)).rejects.toMatchObject({ status: 409 });
  });
  it('valida espécie e dose única', async () => {
    const { u, db } = fixture({ vacina: [vaccine] });
    await saveApplication(u, { aplicacao: application });
    expect(db.aplicacao).toHaveLength(1);
    await expect(saveApplication(u, { aplicacao: application })).rejects.toMatchObject({ status: 409 });
    db.vacina[0].especie_alvo = 'cachorro';
    await expect(saveApplication(u, { aplicacao: { ...application, dose: 2 } })).rejects.toMatchObject({ status: 409 });
  });
  it('cria vacina e aplicação com id retornado', async () => {
    const { u, db } = fixture();
    await saveApplication(u, { aplicacao: { ...application, id_vacina: null }, novaVacina: { nome: 'V1', especie_alvo: 'ambos' } });
    expect(db.aplicacao[0].id_vacina).toBe(db.vacina[0].id);
  });
  it('não altera espécie alvo de vacina incompatível com histórico', async () => {
    const { u } = fixture({ vacina: [vaccine], aplicacao: [application] });
    await expect(saveSimple(u, 'vacina', { ...vaccine, especie_alvo: 'cachorro' }, { id: 1 })).rejects.toMatchObject({ status: 409 });
  });
});
describe('equipe e feiras', () => {
  it('upsert de voluntário e função não duplica vínculo', async () => {
    const { u, db } = fixture();
    await saveTeam(u, shelter.cnpj, 'voluntario', { pessoa: person, funcao: 'Apoio' });
    await saveTeam(u, shelter.cnpj, 'voluntario', { pessoa: person, funcao: 'Coordenação' });
    expect(db.voluntario).toHaveLength(1); expect(db.atua).toHaveLength(1);
    expect(db.atua[0].funcao).toBe('Coordenação');
  });
  it('unlink remove participações apenas nas feiras do abrigo', async () => {
    const { u, db } = fixture({ voluntario: [person], atua: [{ cnpj_abrigo: shelter.cnpj, cpf_voluntario: person.cpf, funcao: 'Apoio' }],
      feira_adocao: [{ id: 1, cnpj_abrigo: shelter.cnpj, nome: 'Feira', logradouro: 'Rua', data: '2026-12-01' }],
      participa: [{ cpf_voluntario: person.cpf, id_feira_adocao: 1 }, { cpf_voluntario: person.cpf, id_feira_adocao: 2 }] });
    await unlinkTeam(u, shelter.cnpj, person.cpf, 'voluntario');
    expect(db.atua).toEqual([]); expect(db.participa.map(p => p.id_feira_adocao)).toEqual([2]);
    expect(db.voluntario).toHaveLength(1);
  });
  it('desvincula veterinário preservando histórico clínico', async () => {
    const { u, db } = fixture({ ...linked, atendimento: [{ ...visit, id: 1 }] });
    await unlinkTeam(u, shelter.cnpj, vet.cpf, 'veterinario');
    expect(db.vinculo).toEqual([]); expect(db.atendimento).toHaveLength(1); expect(db.veterinario).toHaveLength(1);
  });
  it('recusa CRMV pertencente a outro CPF', async () => {
    const { u } = fixture(linked);
    await expect(saveTeam(u, shelter.cnpj, 'veterinario', { pessoa: { ...vet, cpf: '00000000002', crmv: 'df-123' } })).rejects.toMatchObject({ status: 409 });
  });
  it('participantes devem estar vinculados; exclusão limpa participação', async () => {
    const { u, db } = fixture(); const feira = { cnpj_abrigo: shelter.cnpj, nome: 'Feira', logradouro: 'Rua', data: '2026-12-01' };
    await expect(saveFair(u, { feira, participantes: [person.cpf] })).rejects.toMatchObject({ status: 409 });
    await saveTeam(u, shelter.cnpj, 'voluntario', { pessoa: person, funcao: 'Apoio' });
    const saved = await saveFair(u, { feira, participantes: [person.cpf] });
    expect(db.participa).toHaveLength(1);
    await deleteFair(u, saved.id); expect(db.participa).toEqual([]);
  });
});
describe('foto', () => {
  const file = { buffer: Buffer.from([137,80,78,71,13,10,26,10]), mimetype: 'image/png', originalname: '../luna.png' };
  it('aceita assinatura PNG e normaliza nome', () => { expect(validatePhoto(file).originalname).toBe('.._luna.png'); });
  it('aceita assinatura JPEG', () => { expect(validatePhoto({ ...file, buffer: Buffer.from([255,216,255]), mimetype: 'image/jpeg' })).toBeDefined(); });
  it('recusa tipo divergente, vazio e tamanho excedido', () => {
    expect(() => validatePhoto({ ...file, mimetype: 'image/jpeg' })).toThrow();
    expect(() => validatePhoto({ ...file, buffer: Buffer.alloc(0) })).toThrow();
    expect(() => validatePhoto({ ...file, buffer: Buffer.alloc(5 * 1024 * 1024 + 1) })).toThrow();
  });
});
