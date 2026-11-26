# Catálogo das consultas de domínio

Cada entrada abaixo corresponde a uma string vazia em `backend/src/api/domain.queries.ts`. Não contém SQL executável. A ordem dos parâmetros é obrigatória.

O tipo `number` representa INT/SERIAL ou NUMERIC conforme o schema existente; campos `peso` e `valor` aceitam no máximo duas casas decimais. Documentos são strings. Todos os nomes de colunas de retorno devem estar em minúsculas.

Para bloqueios, cardinalidade, efeitos e ordem dos fluxos, consulte [SQL_BACKEND.md](./SQL_BACKEND.md).

## doador

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `doador.list` | nenhum | Ler TODAS as linhas de doador, ordenadas pela chave documento; sem joins/filtros/limite. | 0..N linhas completas (documento, nome, email, telefone).  |
| `doador.insert` | $1: documento (text); $2: nome (text); $3: email (text, nullable); $4: telefone (text, nullable) | Criar uma linha, gerando id quando SERIAL em doador. | exatamente 1 linhas completas (documento, nome, email, telefone). rowCount = 1, inclusive delete; devolver linha removida. |
| `doador.update` | $1: nome (text); $2: email (text, nullable); $3: telefone (text, nullable); $4: documento (text) | Atualizar todos os campos mutáveis de uma linha pela chave completa em doador. | exatamente 1 linhas completas (documento, nome, email, telefone). rowCount = 1, inclusive delete; devolver linha removida. |
| `doador.delete` | $1: documento (text) | Remover exatamente a linha de doador identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (documento, nome, email, telefone). rowCount = 1, inclusive delete; devolver linha removida. |

## abrigo

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `abrigo.list` | nenhum | Ler TODAS as linhas de abrigo, ordenadas pela chave cnpj; sem joins/filtros/limite. | 0..N linhas completas (cnpj, nome, telefone, capacidade, logradouro, cep, uf, cidade).  |
| `abrigo.insert` | $1: cnpj (text); $2: nome (text); $3: telefone (text); $4: capacidade (number); $5: logradouro (text); $6: cep (text, nullable); $7: uf (text); $8: cidade (text) | Criar uma linha, gerando id quando SERIAL em abrigo. | exatamente 1 linhas completas (cnpj, nome, telefone, capacidade, logradouro, cep, uf, cidade). rowCount = 1, inclusive delete; devolver linha removida. |
| `abrigo.update` | $1: nome (text); $2: telefone (text); $3: capacidade (number); $4: logradouro (text); $5: cep (text, nullable); $6: uf (text); $7: cidade (text); $8: cnpj (text) | Atualizar todos os campos mutáveis de uma linha pela chave completa em abrigo. | exatamente 1 linhas completas (cnpj, nome, telefone, capacidade, logradouro, cep, uf, cidade). rowCount = 1, inclusive delete; devolver linha removida. |
| `abrigo.delete` | $1: cnpj (text) | Remover exatamente a linha de abrigo identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (cnpj, nome, telefone, capacidade, logradouro, cep, uf, cidade). rowCount = 1, inclusive delete; devolver linha removida. |

## voluntario

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `voluntario.list` | nenhum | Ler TODAS as linhas de voluntario, ordenadas pela chave cpf; sem joins/filtros/limite. | 0..N linhas completas (cpf, email, nome, telefone).  |
| `voluntario.insert` | $1: cpf (text); $2: email (text, nullable); $3: nome (text); $4: telefone (text, nullable) | Criar uma linha, gerando id quando SERIAL em voluntario. | exatamente 1 linhas completas (cpf, email, nome, telefone). rowCount = 1, inclusive delete; devolver linha removida. |
| `voluntario.update` | $1: email (text, nullable); $2: nome (text); $3: telefone (text, nullable); $4: cpf (text) | Atualizar todos os campos mutáveis de uma linha pela chave completa em voluntario. | exatamente 1 linhas completas (cpf, email, nome, telefone). rowCount = 1, inclusive delete; devolver linha removida. |
| `voluntario.delete` | $1: cpf (text) | Remover exatamente a linha de voluntario identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (cpf, email, nome, telefone). rowCount = 1, inclusive delete; devolver linha removida. |

## veterinario

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `veterinario.list` | nenhum | Ler TODAS as linhas de veterinario, ordenadas pela chave cpf; sem joins/filtros/limite. | 0..N linhas completas (cpf, email, nome, telefone, crmv).  |
| `veterinario.insert` | $1: cpf (text); $2: email (text, nullable); $3: nome (text); $4: telefone (text, nullable); $5: crmv (text) | Criar uma linha, gerando id quando SERIAL em veterinario. | exatamente 1 linhas completas (cpf, email, nome, telefone, crmv). rowCount = 1, inclusive delete; devolver linha removida. |
| `veterinario.update` | $1: email (text, nullable); $2: nome (text); $3: telefone (text, nullable); $4: crmv (text); $5: cpf (text) | Atualizar todos os campos mutáveis de uma linha pela chave completa em veterinario. | exatamente 1 linhas completas (cpf, email, nome, telefone, crmv). rowCount = 1, inclusive delete; devolver linha removida. |
| `veterinario.delete` | $1: cpf (text) | Remover exatamente a linha de veterinario identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (cpf, email, nome, telefone, crmv). rowCount = 1, inclusive delete; devolver linha removida. |

## adotante

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `adotante.list` | nenhum | Ler TODAS as linhas de adotante, ordenadas pela chave cpf; sem joins/filtros/limite. | 0..N linhas completas (cpf, email, nome, telefone).  |
| `adotante.insert` | $1: cpf (text); $2: email (text); $3: nome (text); $4: telefone (text) | Criar uma linha, gerando id quando SERIAL em adotante. | exatamente 1 linhas completas (cpf, email, nome, telefone). rowCount = 1, inclusive delete; devolver linha removida. |
| `adotante.update` | $1: email (text); $2: nome (text); $3: telefone (text); $4: cpf (text) | Atualizar todos os campos mutáveis de uma linha pela chave completa em adotante. | exatamente 1 linhas completas (cpf, email, nome, telefone). rowCount = 1, inclusive delete; devolver linha removida. |
| `adotante.delete` | $1: cpf (text) | Remover exatamente a linha de adotante identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (cpf, email, nome, telefone). rowCount = 1, inclusive delete; devolver linha removida. |

## vacina

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `vacina.list` | nenhum | Ler TODAS as linhas de vacina, ordenadas pela chave id; sem joins/filtros/limite. | 0..N linhas completas (id, nome, especie_alvo).  |
| `vacina.insert` | $1: nome (text); $2: especie_alvo (text) | Criar uma linha, gerando id quando SERIAL em vacina. | exatamente 1 linhas completas (id, nome, especie_alvo). rowCount = 1, inclusive delete; devolver linha removida. |
| `vacina.update` | $1: nome (text); $2: especie_alvo (text); $3: id (number) | Atualizar todos os campos mutáveis de uma linha pela chave completa em vacina. | exatamente 1 linhas completas (id, nome, especie_alvo). rowCount = 1, inclusive delete; devolver linha removida. |
| `vacina.delete` | $1: id (number) | Remover exatamente a linha de vacina identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (id, nome, especie_alvo). rowCount = 1, inclusive delete; devolver linha removida. |

## doacao

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `doacao.list` | nenhum | Ler TODAS as linhas de doacao, ordenadas pela chave id; sem joins/filtros/limite. | 0..N linhas completas (id, cnpj_abrigo, documento_doador, valor, descricao, data, tipo).  |
| `doacao.insert` | $1: cnpj_abrigo (text); $2: documento_doador (text, nullable); $3: valor (number, nullable); $4: descricao (text, nullable); $5: data (date); $6: tipo (text) | Criar uma linha, gerando id quando SERIAL em doacao. | exatamente 1 linhas completas (id, cnpj_abrigo, documento_doador, valor, descricao, data, tipo). rowCount = 1, inclusive delete; devolver linha removida. |
| `doacao.update` | $1: cnpj_abrigo (text); $2: documento_doador (text, nullable); $3: valor (number, nullable); $4: descricao (text, nullable); $5: data (date); $6: tipo (text); $7: id (number) | Atualizar todos os campos mutáveis de uma linha pela chave completa em doacao. | exatamente 1 linhas completas (id, cnpj_abrigo, documento_doador, valor, descricao, data, tipo). rowCount = 1, inclusive delete; devolver linha removida. |
| `doacao.delete` | $1: id (number) | Remover exatamente a linha de doacao identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (id, cnpj_abrigo, documento_doador, valor, descricao, data, tipo). rowCount = 1, inclusive delete; devolver linha removida. |

## animal

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `animal.list` | nenhum | Ler TODAS as linhas de animal, ordenadas pela chave id; sem joins/filtros/limite. | 0..N linhas completas (id, cnpj_abrigo, sexo, nome, data_nascimento, raca, status, castrado, especie).  |
| `animal.insert` | $1: cnpj_abrigo (text); $2: sexo (text); $3: nome (text); $4: data_nascimento (date, nullable); $5: raca (text); $6: status (text); $7: castrado (boolean); $8: especie (text) | Criar uma linha, gerando id quando SERIAL em animal. | exatamente 1 linhas completas (id, cnpj_abrigo, sexo, nome, data_nascimento, raca, status, castrado, especie). rowCount = 1, inclusive delete; devolver linha removida. |
| `animal.update` | $1: cnpj_abrigo (text); $2: sexo (text); $3: nome (text); $4: data_nascimento (date, nullable); $5: raca (text); $6: status (text); $7: castrado (boolean); $8: especie (text); $9: id (number) | Atualizar todos os campos mutáveis de uma linha pela chave completa em animal. | exatamente 1 linhas completas (id, cnpj_abrigo, sexo, nome, data_nascimento, raca, status, castrado, especie). rowCount = 1, inclusive delete; devolver linha removida. |
| `animal.delete` | $1: id (number) | Remover exatamente a linha de animal identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (id, cnpj_abrigo, sexo, nome, data_nascimento, raca, status, castrado, especie). rowCount = 1, inclusive delete; devolver linha removida. |

## prontuario

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `prontuario.list` | nenhum | Ler TODAS as linhas de prontuario, ordenadas pela chave id; sem joins/filtros/limite. | 0..N linhas completas (id, id_animal, data_abertura, alergias, observacoes, peso).  |
| `prontuario.insert` | $1: id_animal (number); $2: data_abertura (date); $3: alergias (text, nullable); $4: observacoes (text, nullable); $5: peso (number, nullable) | Criar uma linha, gerando id quando SERIAL em prontuario. | exatamente 1 linhas completas (id, id_animal, data_abertura, alergias, observacoes, peso). rowCount = 1, inclusive delete; devolver linha removida. |
| `prontuario.update` | $1: id_animal (number); $2: data_abertura (date); $3: alergias (text, nullable); $4: observacoes (text, nullable); $5: peso (number, nullable); $6: id (number) | Atualizar todos os campos mutáveis de uma linha pela chave completa em prontuario. | exatamente 1 linhas completas (id, id_animal, data_abertura, alergias, observacoes, peso). rowCount = 1, inclusive delete; devolver linha removida. |
| `prontuario.delete` | $1: id (number) | Remover exatamente a linha de prontuario identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (id, id_animal, data_abertura, alergias, observacoes, peso). rowCount = 1, inclusive delete; devolver linha removida. |

## atendimento

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `atendimento.list` | nenhum | Ler TODAS as linhas de atendimento, ordenadas pela chave id; sem joins/filtros/limite. | 0..N linhas completas (id, cpf_veterinario, id_prontuario, data, diagnostico, tratamento, tipo, peso).  |
| `atendimento.insert` | $1: cpf_veterinario (text); $2: id_prontuario (number); $3: data (date); $4: diagnostico (text); $5: tratamento (text, nullable); $6: tipo (text); $7: peso (number, nullable) | Criar uma linha, gerando id quando SERIAL em atendimento. | exatamente 1 linhas completas (id, cpf_veterinario, id_prontuario, data, diagnostico, tratamento, tipo, peso). rowCount = 1, inclusive delete; devolver linha removida. |
| `atendimento.update` | $1: cpf_veterinario (text); $2: id_prontuario (number); $3: data (date); $4: diagnostico (text); $5: tratamento (text, nullable); $6: tipo (text); $7: peso (number, nullable); $8: id (number) | Atualizar todos os campos mutáveis de uma linha pela chave completa em atendimento. | exatamente 1 linhas completas (id, cpf_veterinario, id_prontuario, data, diagnostico, tratamento, tipo, peso). rowCount = 1, inclusive delete; devolver linha removida. |
| `atendimento.delete` | $1: id (number) | Remover exatamente a linha de atendimento identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (id, cpf_veterinario, id_prontuario, data, diagnostico, tratamento, tipo, peso). rowCount = 1, inclusive delete; devolver linha removida. |

## pedido_adocao

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `pedido_adocao.list` | nenhum | Ler TODAS as linhas de pedido_adocao, ordenadas pela chave id; sem joins/filtros/limite. | 0..N linhas completas (id, id_animal, cpf_adotante, status, data_pedido, data_decisao).  |
| `pedido_adocao.insert` | $1: id_animal (number); $2: cpf_adotante (text); $3: status (text); $4: data_pedido (date); $5: data_decisao (date, nullable) | Criar uma linha, gerando id quando SERIAL em pedido_adocao. | exatamente 1 linhas completas (id, id_animal, cpf_adotante, status, data_pedido, data_decisao). rowCount = 1, inclusive delete; devolver linha removida. |
| `pedido_adocao.update` | $1: id_animal (number); $2: cpf_adotante (text); $3: status (text); $4: data_pedido (date); $5: data_decisao (date, nullable); $6: id (number) | Atualizar todos os campos mutáveis de uma linha pela chave completa em pedido_adocao. | exatamente 1 linhas completas (id, id_animal, cpf_adotante, status, data_pedido, data_decisao). rowCount = 1, inclusive delete; devolver linha removida. |
| `pedido_adocao.delete` | $1: id (number) | Remover exatamente a linha de pedido_adocao identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (id, id_animal, cpf_adotante, status, data_pedido, data_decisao). rowCount = 1, inclusive delete; devolver linha removida. |

## feira_adocao

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `feira_adocao.list` | nenhum | Ler TODAS as linhas de feira_adocao, ordenadas pela chave id; sem joins/filtros/limite. | 0..N linhas completas (id, cnpj_abrigo, nome, logradouro, data).  |
| `feira_adocao.insert` | $1: cnpj_abrigo (text); $2: nome (text); $3: logradouro (text); $4: data (date) | Criar uma linha, gerando id quando SERIAL em feira_adocao. | exatamente 1 linhas completas (id, cnpj_abrigo, nome, logradouro, data). rowCount = 1, inclusive delete; devolver linha removida. |
| `feira_adocao.update` | $1: cnpj_abrigo (text); $2: nome (text); $3: logradouro (text); $4: data (date); $5: id (number) | Atualizar todos os campos mutáveis de uma linha pela chave completa em feira_adocao. | exatamente 1 linhas completas (id, cnpj_abrigo, nome, logradouro, data). rowCount = 1, inclusive delete; devolver linha removida. |
| `feira_adocao.delete` | $1: id (number) | Remover exatamente a linha de feira_adocao identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (id, cnpj_abrigo, nome, logradouro, data). rowCount = 1, inclusive delete; devolver linha removida. |

## atua

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `atua.list` | nenhum | Ler TODAS as linhas de atua, ordenadas pela chave cnpj_abrigo, cpf_voluntario; sem joins/filtros/limite. | 0..N linhas completas (cnpj_abrigo, cpf_voluntario, funcao).  |
| `atua.insert` | $1: cnpj_abrigo (text); $2: cpf_voluntario (text); $3: funcao (text) | Criar uma linha, gerando id quando SERIAL em atua. | exatamente 1 linhas completas (cnpj_abrigo, cpf_voluntario, funcao). rowCount = 1, inclusive delete; devolver linha removida. |
| `atua.update` | $1: funcao (text); $2: cnpj_abrigo (text); $3: cpf_voluntario (text) | Atualizar todos os campos mutáveis de uma linha pela chave completa em atua. | exatamente 1 linhas completas (cnpj_abrigo, cpf_voluntario, funcao). rowCount = 1, inclusive delete; devolver linha removida. |
| `atua.delete` | $1: cnpj_abrigo (text); $2: cpf_voluntario (text) | Remover exatamente a linha de atua identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (cnpj_abrigo, cpf_voluntario, funcao). rowCount = 1, inclusive delete; devolver linha removida. |

## vinculo

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `vinculo.list` | nenhum | Ler TODAS as linhas de vinculo, ordenadas pela chave cpf_veterinario, cnpj_abrigo; sem joins/filtros/limite. | 0..N linhas completas (cpf_veterinario, cnpj_abrigo).  |
| `vinculo.insert` | $1: cpf_veterinario (text); $2: cnpj_abrigo (text) | Criar uma linha, gerando id quando SERIAL em vinculo. | exatamente 1 linhas completas (cpf_veterinario, cnpj_abrigo). rowCount = 1, inclusive delete; devolver linha removida. |
| `vinculo.update` | $1: cpf_veterinario (text); $2: cnpj_abrigo (text) | Atualizar todos os campos mutáveis de uma linha pela chave completa em vinculo. | exatamente 1 linhas completas (cpf_veterinario, cnpj_abrigo). rowCount = 1, inclusive delete; devolver linha removida. |
| `vinculo.delete` | $1: cpf_veterinario (text); $2: cnpj_abrigo (text) | Remover exatamente a linha de vinculo identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (cpf_veterinario, cnpj_abrigo). rowCount = 1, inclusive delete; devolver linha removida. |

## aplicacao

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `aplicacao.list` | nenhum | Ler TODAS as linhas de aplicacao, ordenadas pela chave id_prontuario, id_vacina, dose; sem joins/filtros/limite. | 0..N linhas completas (id_prontuario, id_vacina, dose, data_aplicacao, lote).  |
| `aplicacao.insert` | $1: id_prontuario (number); $2: id_vacina (number); $3: dose (number); $4: data_aplicacao (date); $5: lote (text) | Criar uma linha, gerando id quando SERIAL em aplicacao. | exatamente 1 linhas completas (id_prontuario, id_vacina, dose, data_aplicacao, lote). rowCount = 1, inclusive delete; devolver linha removida. |
| `aplicacao.update` | $1: data_aplicacao (date); $2: lote (text); $3: id_prontuario (number); $4: id_vacina (number); $5: dose (number) | Atualizar todos os campos mutáveis de uma linha pela chave completa em aplicacao. | exatamente 1 linhas completas (id_prontuario, id_vacina, dose, data_aplicacao, lote). rowCount = 1, inclusive delete; devolver linha removida. |
| `aplicacao.delete` | $1: id_prontuario (number); $2: id_vacina (number); $3: dose (number) | Remover exatamente a linha de aplicacao identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (id_prontuario, id_vacina, dose, data_aplicacao, lote). rowCount = 1, inclusive delete; devolver linha removida. |

## participa

| ID | Parâmetros em ordem | Finalidade | Retorno |
| --- | --- | --- | --- |
| `participa.list` | nenhum | Ler TODAS as linhas de participa, ordenadas pela chave cpf_voluntario, id_feira_adocao; sem joins/filtros/limite. | 0..N linhas completas (cpf_voluntario, id_feira_adocao).  |
| `participa.insert` | $1: cpf_voluntario (text); $2: id_feira_adocao (number) | Criar uma linha, gerando id quando SERIAL em participa. | exatamente 1 linhas completas (cpf_voluntario, id_feira_adocao). rowCount = 1, inclusive delete; devolver linha removida. |
| `participa.update` | $1: cpf_voluntario (text); $2: id_feira_adocao (number) | Atualizar todos os campos mutáveis de uma linha pela chave completa em participa. | exatamente 1 linhas completas (cpf_voluntario, id_feira_adocao). rowCount = 1, inclusive delete; devolver linha removida. |
| `participa.delete` | $1: cpf_voluntario (text); $2: id_feira_adocao (number) | Remover exatamente a linha de participa identificada por TODOS os componentes da chave; sem cascatas implícitas. | exatamente 1 linhas completas (cpf_voluntario, id_feira_adocao). rowCount = 1, inclusive delete; devolver linha removida. |
