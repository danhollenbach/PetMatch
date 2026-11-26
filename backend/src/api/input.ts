import { BadRequestException } from '@nestjs/common';
import { assertKeys } from './rules.js';
import { object, validate, type Table } from './schema.js';

/** Valida formato antes do preflight; consultas ausentes não ocultam JSON inválido. */
export function validateCommand(table: Table, input: unknown, updating = false) {
  const body = object(input);
  switch (table) {
    case 'abrigo':
      if (updating) return validate(table, body);
      assertKeys(body, ['abrigo','gestor']);
      validate('abrigo', body.abrigo); validate('voluntario', body.gestor); return;
    case 'animal':
      assertKeys(body, ['animal','prontuario']);
      validate('animal', body.animal, ['id']); validate('prontuario', body.prontuario, ['id','id_animal']); return;
    case 'pedido_adocao':
      assertKeys(body, ['adotante','id_animal']);
      validate('adotante', body.adotante);
      validate('pedido_adocao', { id_animal: body.id_animal }, ['id','cpf_adotante','status','data_pedido','data_decisao']); return;
    case 'doacao': {
      assertKeys(body, ['doacao','doador']);
      if (body.doador != null) validate('doador', body.doador);
      const data = object(body.doacao);
      assertKeys(data, ['cnpj_abrigo','valor','descricao','data','tipo']);
      validate('doacao', { ...data, documento_doador: null }, ['id']); return;
    }
    case 'feira_adocao':
      assertKeys(body, ['feira','participantes']); validate('feira_adocao', body.feira, ['id']);
      if (!Array.isArray(body.participantes)) throw new BadRequestException('Informe participantes.');
      for (const cpf of body.participantes) validate('voluntario', { cpf }, ['nome','email','telefone']); return;
    case 'atendimento': return validate(table, body, ['id']);
    case 'prontuario':
      if (!updating) throw new BadRequestException('Prontuário é criado junto com o animal.');
      return validate(table, body);
    default: return validate(table, body, updating ? [] : ['id']);
  }
}
