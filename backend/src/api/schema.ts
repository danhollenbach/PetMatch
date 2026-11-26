import { BadRequestException } from '@nestjs/common';
import type { Database } from './model.js';

export type Table = keyof Database;
export type Row<K extends Table> = Database[K][number];
type Rule = { kind: 'text' | 'number' | 'date' | 'boolean'; max?: number; min?: number;
  pattern?: RegExp; choices?: readonly string[]; nullable?: boolean; integer?: boolean };
const text = (max: number, nullable = false, pattern?: RegExp): Rule => ({ kind: 'text', max, nullable, pattern });
const number = (max: number, min = 1, nullable = false, integer = true): Rule => ({ kind: 'number', max, min, nullable, integer });
const choice = (...choices: string[]): Rule => ({ kind: 'text', choices });
const date: Rule = { kind: 'date' };
const cpf = text(11, false, /^\d{11}$/);
const cnpj = text(14, false, /^\d{14}$/);
const email = (nullable = false) => text(120, nullable, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
const phone = (nullable = false) => text(20, nullable, /^\d{10,20}$/);
const person = { cpf, email: email(true), nome: text(120), telefone: phone(true) };
const id = number(2147483647);
const weight = number(999.99, 0.01, true, false);
export const schemas: Record<Table, Record<string, Rule>> = {
  doador: { documento: text(14, false, /^(\d{11}|\d{14})$/), nome: text(120), email: email(true), telefone: phone(true) },
  abrigo: { cnpj, nome: text(120), telefone: phone(), capacidade: number(2147483647, 0), logradouro: text(150),
    cep: text(8, true, /^\d{8}$/), uf: choice('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'), cidade: text(80) },
  voluntario: person,
  veterinario: { ...person, crmv: text(20) },
  adotante: { ...person, email: email(), telefone: phone() },
  vacina: { id, nome: text(80), especie_alvo: choice('cachorro','gato','ambos') },
  doacao: { id, cnpj_abrigo: cnpj, documento_doador: { ...schemasDocument(), nullable: true },
    valor: number(99999999.99, 0.01, true, false), descricao: text(200, true), data: date, tipo: choice('dinheiro','insumo') },
  animal: { id, cnpj_abrigo: cnpj, sexo: choice('M','F'), nome: text(60), data_nascimento: { ...date, nullable: true },
    raca: text(60), status: choice('disponivel','em_tratamento','reservado','adotado'), castrado: { kind: 'boolean' }, especie: choice('cachorro','gato') },
  prontuario: { id, id_animal: id, data_abertura: date, alergias: text(200, true), observacoes: text(100000, true), peso: weight },
  atendimento: { id, cpf_veterinario: cpf, id_prontuario: id, data: date, diagnostico: text(100000), tratamento: text(100000, true),
    tipo: choice('consulta','retorno','exame','cirurgia','emergencia'), peso: weight },
  pedido_adocao: { id, id_animal: id, cpf_adotante: cpf, status: choice('pendente','aprovado','reprovado'), data_pedido: date, data_decisao: { ...date, nullable: true } },
  feira_adocao: { id, cnpj_abrigo: cnpj, nome: text(120), logradouro: text(150), data: date },
  atua: { cnpj_abrigo: cnpj, cpf_voluntario: cpf, funcao: text(30) },
  vinculo: { cpf_veterinario: cpf, cnpj_abrigo: cnpj },
  aplicacao: { id_prontuario: id, id_vacina: id, dose: id, data_aplicacao: date, lote: text(30) },
  participa: { cpf_voluntario: cpf, id_feira_adocao: id },
};
function schemasDocument() { return text(14, false, /^(\d{11}|\d{14})$/); }
export const keys: Record<Table, string[]> = {
  doador: ['documento'], abrigo: ['cnpj'], voluntario: ['cpf'], veterinario: ['cpf'], adotante: ['cpf'],
  vacina: ['id'], doacao: ['id'], animal: ['id'], prontuario: ['id'], atendimento: ['id'], pedido_adocao: ['id'], feira_adocao: ['id'],
  atua: ['cnpj_abrigo','cpf_voluntario'], vinculo: ['cpf_veterinario','cnpj_abrigo'],
  aplicacao: ['id_prontuario','id_vacina','dose'], participa: ['cpf_voluntario','id_feira_adocao'],
};
export const tables = Object.keys(schemas) as Table[];
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('Objeto JSON esperado.');
  return value as Record<string, unknown>;
}
export function validate<K extends Table>(table: K, input: unknown, omit: string[] = []): Row<K> {
  const data = object(input);
  const fields = Object.entries(schemas[table]).filter(([key]) => !omit.includes(key));
  if (Object.keys(data).some(key => !fields.some(([name]) => key === name))) throw new BadRequestException('Campo desconhecido ou controlado pelo servidor.');
  const result: Record<string, unknown> = {};
  for (const [name, rule] of fields) {
    let v = data[name];
    if (rule.nullable && (v === null || v === undefined)) { result[name] = null; continue; }
    if (typeof v === 'string') v = v.trim();
    const valid = rule.kind === 'boolean' ? typeof v === 'boolean'
      : rule.kind === 'number' ? typeof v === 'number' && Number.isFinite(v) && v >= rule.min! && v <= rule.max!
        && (rule.integer ? Number.isInteger(v) : Math.abs(v * 100 - Math.round(v * 100)) < 1e-6)
      : rule.kind === 'date' ? typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v
      : typeof v === 'string' && v.length > 0 && (!rule.max || v.length <= rule.max)
        && (!rule.pattern || rule.pattern.test(v)) && (!rule.choices || rule.choices.includes(v));
    if (!valid) throw new BadRequestException(`Campo inválido: ${name}.`);
    result[name] = name === 'email' ? (v as string).toLowerCase() : name === 'crmv' ? (v as string).toUpperCase() : v;
  }
  return result as Row<K>;
}
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
export function past(value: string | null) {
  if (value && value > today()) throw new BadRequestException('A data não pode estar no futuro.');
}
