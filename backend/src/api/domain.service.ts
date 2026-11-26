import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { validateCommand } from './input.js';
import { DomainRepository, writes } from './repository.js';
import { animalDeleteWrites, animalWrites, saveAnimal, deleteAnimal, registerShelter, shelterWrites } from './animals.business.js';
import { adoptionWrites, requestAdoption, decideAdoption } from './adoption.business.js';
import { clinicalWrites, saveVisit, deleteVisit, applicationWrites, saveApplication } from './clinical.business.js';
import { teamWrites, saveTeam, unlinkTeam, fairWrites, saveFair, deleteFair } from './team.business.js';
import { donationWrites, saveDonation, saveSimple, deleteSimple } from './crud.business.js';
import { id } from './rules.js';
import { keys, schemas, object, validate, type Table } from './schema.js';

export const resources: Record<string, Table> = {
  abrigos: 'abrigo', animais: 'animal', adotantes: 'adotante', 'pedidos-adocao': 'pedido_adocao',
  doadores: 'doador', doacoes: 'doacao', voluntarios: 'voluntario', veterinarios: 'veterinario',
  prontuarios: 'prontuario', atendimentos: 'atendimento', vacinas: 'vacina', feiras: 'feira_adocao',
};
function tableFor(resource: string) {
  const table = Object.hasOwn(resources, resource) ? resources[resource] : undefined;
  if (!table) throw new NotFoundException('Recurso inexistente.');
  return table;
}
function keyFor(table: Table, value: string) {
  const field = keys[table][0];
  const key = { [field]: field === 'id' ? id(value) : value };
  return validate(table, key, Object.keys(schemas[table]).filter(k => k !== field));
}
@Injectable()
export class DomainService {
  constructor(private readonly repository: DomainRepository) {}
  snapshot() { return this.repository.snapshot(); }
  list(resource: string) { const table = tableFor(resource); return this.repository.transaction([], async u => u.db[table]); }
  get(resource: string, value: string) {
    const table = tableFor(resource), key = keyFor(table, value);
    return this.repository.transaction([], async u => u.require(table, key));
  }
  create(resource: string, body: unknown) {
    const table = tableFor(resource);
    validateCommand(table, body);
    if (table === 'abrigo') return this.repository.transaction(shelterWrites, u => registerShelter(u, body));
    if (table === 'animal') return this.repository.transaction(animalWrites, u => saveAnimal(u, body));
    if (table === 'pedido_adocao') return this.repository.transaction(adoptionWrites, u => requestAdoption(u, body));
    if (table === 'atendimento') return this.repository.transaction(clinicalWrites, u => saveVisit(u, body));
    if (table === 'doacao') return this.repository.transaction(donationWrites, u => saveDonation(u, body));
    if (table === 'feira_adocao') return this.repository.transaction(fairWrites, u => saveFair(u, body));
    return this.repository.transaction(writes([table,'insert']), u => saveSimple(u, table, body));
  }
  update(resource: string, value: string, body: unknown) {
    const table = tableFor(resource), key = keyFor(table, value);
    if (table === 'pedido_adocao') throw new BadRequestException('Use a rota de decisão. Pedidos finalizados são imutáveis.');
    if (['animal','atendimento','doacao','feira_adocao'].includes(table)) validateCommand(table, body, true);
    if (table === 'animal') return this.repository.transaction(animalWrites, u => saveAnimal(u, body, id(value)));
    if (table === 'atendimento') return this.repository.transaction(clinicalWrites, u => saveVisit(u, body, id(value)));
    if (table === 'doacao') return this.repository.transaction(donationWrites, u => saveDonation(u, body, id(value)));
    if (table === 'feira_adocao') return this.repository.transaction(fairWrites, u => saveFair(u, body, id(value)));
    const input = object(body);
    for (const [name, v] of Object.entries(key)) if (input[name] !== undefined && input[name] !== v) throw new BadRequestException('Chave primária é imutável.');
    validateCommand(table, { ...input, ...key }, true);
    return this.repository.transaction(writes([table,'update'], ['prontuario','update'], ['animal','update']), u => saveSimple(u, table, { ...input, ...key }, key));
  }
  remove(resource: string, value: string) {
    const table = tableFor(resource), key = keyFor(table, value);
    if (table === 'prontuario' || table === 'pedido_adocao') throw new BadRequestException('Este registro não pode ser excluído isoladamente.');
    if (table === 'animal') return this.repository.transaction(animalDeleteWrites, u => deleteAnimal(u, id(value)));
    if (table === 'atendimento') return this.repository.transaction(clinicalWrites, u => deleteVisit(u, id(value)));
    if (table === 'feira_adocao') return this.repository.transaction(fairWrites, u => deleteFair(u, id(value)));
    return this.repository.transaction(writes([table,'delete']), u => deleteSimple(u, table, key));
  }
  decide(value: string, body: unknown) {
    const number = id(value);
    const input = object(body);
    if (Object.keys(input).some(key => key !== 'decisao') || !['aprovado','reprovado'].includes(String(input.decisao))) throw new BadRequestException('Informe apenas decisão aprovado ou reprovado.');
    return this.repository.transaction(adoptionWrites, u => decideAdoption(u, number, body));
  }
  team(cnpj: string, kind: string, body: unknown, cpf?: string) {
    keyFor('abrigo', cnpj);
    if (!['voluntarios','veterinarios'].includes(kind)) throw new NotFoundException('Equipe inexistente.');
    const type = kind === 'voluntarios' ? 'voluntario' : 'veterinario';
    if (cpf) keyFor(type, cpf);
    return this.repository.transaction(teamWrites, u => cpf ? unlinkTeam(u, cnpj, cpf, type) : saveTeam(u, cnpj, type, body));
  }
  members(cnpj: string, kind: string) {
    keyFor('abrigo', cnpj);
    if (!['voluntarios','veterinarios'].includes(kind)) throw new NotFoundException('Equipe inexistente.');
    return this.repository.transaction([], async u => {
      u.require('abrigo', { cnpj });
      return kind === 'voluntarios' ? u.db.atua.filter(a => a.cnpj_abrigo === cnpj)
        : u.db.vinculo.filter(v => v.cnpj_abrigo === cnpj);
    });
  }
  participation(value: string, input?: unknown) {
    const fairId = id(value);
    return this.repository.transaction(input === undefined ? [] : fairWrites, async u => {
      const { id: _id, ...feira } = u.require('feira_adocao', { id: fairId });
      if (input === undefined) return u.db.participa.filter(p => p.id_feira_adocao === fairId);
      const body = object(input);
      if (Object.keys(body).some(key => key !== 'participantes')) throw new BadRequestException('Informe apenas participantes.');
      return saveFair(u, { feira, participantes: body.participantes }, fairId);
    });
  }
  listApplications(value: string) {
    const recordId = id(value);
    return this.repository.transaction([], async u => {
      u.require('prontuario', { id: recordId });
      return u.db.aplicacao.filter(a => a.id_prontuario === recordId);
    });
  }
  applications(record: string, body: unknown, vaccine?: string, dose?: string, remove = false) {
    const recordId = id(record);
    const key = vaccine && dose ? { id_prontuario: recordId, id_vacina: id(vaccine), dose: id(dose) } : undefined;
    return this.repository.transaction(applicationWrites, u => {
      u.require('prontuario', { id: recordId });
      if (remove && key) return u.remove('aplicacao', key);
      const data = object(body), ap = object(data.aplicacao);
      if (ap.id_prontuario !== undefined && ap.id_prontuario !== recordId) throw new BadRequestException('Prontuário divergente da rota.');
      return saveApplication(u, { ...data, aplicacao: { ...ap, id_prontuario: recordId } }, key ? { ...key, data_aplicacao: '', lote: '' } : undefined);
    });
  }
}
