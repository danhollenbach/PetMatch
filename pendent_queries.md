# TODO — Queries pendentes

Atualizado em 26/11/2026. São **71 entradas SQL pendentes**: 4 transacionais, 64 de domínio e 3 de foto. Todas continuam vazias; marque cada item somente após implementar e verificar seu contrato.

## Contratos e arquivos

- [domain.queries.ts](backend/src/api/domain.queries.ts): consultas transacionais e CRUDs das 16 tabelas.
- [photo.queries.ts](backend/src/api/photo.queries.ts): leitura, gravação e exclusão da foto.
- [Catálogo detalhado](docs/CATALOGO_QUERIES.md): ordem dos parâmetros e colunas retornadas por cada consulta de domínio.
- [Guia SQL](docs/SQL_BACKEND.md): transações, bloqueios, regras e estrutura binária pendente.

Contrato comum: `list` retorna todas as linhas e colunas, ordenadas pela chave primária. `insert` gera ID quando aplicável e retorna a linha completa. `update` altera os campos mutáveis pela chave completa e retorna a linha atualizada. `delete` remove pela chave completa e retorna a linha removida. As três escritas de domínio devem afetar e retornar exatamente uma linha; valores devem ser enviados por parâmetros.

O catálogo também contém operações não expostas isoladamente na API. Prontuário nasce junto com o animal; pedidos finalizados não podem ser alterados ou excluídos via CRUD. Implementar uma query não autoriza contornar essas regras.

## Transações — 4 queries

- [ ] `transaction.begin` — iniciar transação READ COMMITTED no cliente dedicado.
- [ ] `transaction.lock` — adquirir advisory lock transacional exclusivo com a mesma chave constante em todas as operações, protegendo capacidade, adoções, doses e vínculos concorrentes.
- [ ] `transaction.commit` — confirmar todas as alterações e liberar o bloqueio.
- [ ] `transaction.rollback` — desfazer todas as alterações e liberar o bloqueio.

Nenhuma dessas quatro consultas recebe parâmetros ou exige linhas de retorno. O lock deve durar até o fim da transação, sem permanecer preso à sessão do pool.

## Domínio — 64 queries

### Abrigos

- [ ] `abrigo.list` — listar todos os registros de `abrigo`, com todas as colunas e ordenação pela chave.
- [ ] `abrigo.insert` — inserir registro de abrigo e retornar a linha completa.
- [ ] `abrigo.update` — atualizar os campos mutáveis de abrigo pela chave completa e retornar a linha atualizada.
- [ ] `abrigo.delete` — excluir registro de abrigo pela chave completa e retornar a linha removida.

### Animais

- [ ] `animal.list` — listar todos os registros de `animal`, com todas as colunas e ordenação pela chave.
- [ ] `animal.insert` — inserir registro de animal e retornar a linha completa.
- [ ] `animal.update` — atualizar os campos mutáveis de animal pela chave completa e retornar a linha atualizada.
- [ ] `animal.delete` — excluir registro de animal pela chave completa e retornar a linha removida.

### Adotantes

- [ ] `adotante.list` — listar todos os registros de `adotante`, com todas as colunas e ordenação pela chave.
- [ ] `adotante.insert` — inserir registro de adotante e retornar a linha completa.
- [ ] `adotante.update` — atualizar os campos mutáveis de adotante pela chave completa e retornar a linha atualizada.
- [ ] `adotante.delete` — excluir registro de adotante pela chave completa e retornar a linha removida.

### Pedidos de adoção

- [ ] `pedido_adocao.list` — listar todos os registros de `pedido_adocao`, com todas as colunas e ordenação pela chave.
- [ ] `pedido_adocao.insert` — inserir registro de pedido de adoção e retornar a linha completa.
- [ ] `pedido_adocao.update` — atualizar os campos mutáveis de pedido de adoção pela chave completa e retornar a linha atualizada.
- [ ] `pedido_adocao.delete` — excluir registro de pedido de adoção pela chave completa e retornar a linha removida.

### Doadores

- [ ] `doador.list` — listar todos os registros de `doador`, com todas as colunas e ordenação pela chave.
- [ ] `doador.insert` — inserir registro de doador e retornar a linha completa.
- [ ] `doador.update` — atualizar os campos mutáveis de doador pela chave completa e retornar a linha atualizada.
- [ ] `doador.delete` — excluir registro de doador pela chave completa e retornar a linha removida.

### Doações

- [ ] `doacao.list` — listar todos os registros de `doacao`, com todas as colunas e ordenação pela chave.
- [ ] `doacao.insert` — inserir registro de doação e retornar a linha completa.
- [ ] `doacao.update` — atualizar os campos mutáveis de doação pela chave completa e retornar a linha atualizada.
- [ ] `doacao.delete` — excluir registro de doação pela chave completa e retornar a linha removida.

### Voluntários

- [ ] `voluntario.list` — listar todos os registros de `voluntario`, com todas as colunas e ordenação pela chave.
- [ ] `voluntario.insert` — inserir registro de voluntário e retornar a linha completa.
- [ ] `voluntario.update` — atualizar os campos mutáveis de voluntário pela chave completa e retornar a linha atualizada.
- [ ] `voluntario.delete` — excluir registro de voluntário pela chave completa e retornar a linha removida.

### Veterinários

- [ ] `veterinario.list` — listar todos os registros de `veterinario`, com todas as colunas e ordenação pela chave.
- [ ] `veterinario.insert` — inserir registro de veterinário e retornar a linha completa.
- [ ] `veterinario.update` — atualizar os campos mutáveis de veterinário pela chave completa e retornar a linha atualizada.
- [ ] `veterinario.delete` — excluir registro de veterinário pela chave completa e retornar a linha removida.

### Prontuários

- [ ] `prontuario.list` — listar todos os registros de `prontuario`, com todas as colunas e ordenação pela chave.
- [ ] `prontuario.insert` — inserir registro de prontuário e retornar a linha completa.
- [ ] `prontuario.update` — atualizar os campos mutáveis de prontuário pela chave completa e retornar a linha atualizada.
- [ ] `prontuario.delete` — excluir registro de prontuário pela chave completa e retornar a linha removida.

### Atendimentos

- [ ] `atendimento.list` — listar todos os registros de `atendimento`, com todas as colunas e ordenação pela chave.
- [ ] `atendimento.insert` — inserir registro de atendimento e retornar a linha completa.
- [ ] `atendimento.update` — atualizar os campos mutáveis de atendimento pela chave completa e retornar a linha atualizada.
- [ ] `atendimento.delete` — excluir registro de atendimento pela chave completa e retornar a linha removida.

### Vacinas

- [ ] `vacina.list` — listar todos os registros de `vacina`, com todas as colunas e ordenação pela chave.
- [ ] `vacina.insert` — inserir registro de vacina e retornar a linha completa.
- [ ] `vacina.update` — atualizar os campos mutáveis de vacina pela chave completa e retornar a linha atualizada.
- [ ] `vacina.delete` — excluir registro de vacina pela chave completa e retornar a linha removida.

### Feiras de adoção

- [ ] `feira_adocao.list` — listar todos os registros de `feira_adocao`, com todas as colunas e ordenação pela chave.
- [ ] `feira_adocao.insert` — inserir registro de feira de adoção e retornar a linha completa.
- [ ] `feira_adocao.update` — atualizar os campos mutáveis de feira de adoção pela chave completa e retornar a linha atualizada.
- [ ] `feira_adocao.delete` — excluir registro de feira de adoção pela chave completa e retornar a linha removida.

### Voluntário ↔ abrigo (ATUA)

- [ ] `atua.list` — listar todos os registros de `atua`, com todas as colunas e ordenação pela chave.
- [ ] `atua.insert` — inserir registro de vínculo de voluntário com abrigo e sua função e retornar a linha completa.
- [ ] `atua.update` — atualizar os campos mutáveis de vínculo de voluntário com abrigo e sua função pela chave completa e retornar a linha atualizada.
- [ ] `atua.delete` — excluir registro de vínculo de voluntário com abrigo e sua função pela chave completa e retornar a linha removida.

### Veterinário ↔ abrigo (VINCULO)

- [ ] `vinculo.list` — listar todos os registros de `vinculo`, com todas as colunas e ordenação pela chave.
- [ ] `vinculo.insert` — inserir registro de vínculo de veterinário com abrigo e retornar a linha completa.
- [ ] `vinculo.update` — atualizar os campos mutáveis de vínculo de veterinário com abrigo pela chave completa e retornar a linha atualizada.
- [ ] `vinculo.delete` — excluir registro de vínculo de veterinário com abrigo pela chave completa e retornar a linha removida.

### Aplicações de vacina

- [ ] `aplicacao.list` — listar todos os registros de `aplicacao`, com todas as colunas e ordenação pela chave.
- [ ] `aplicacao.insert` — inserir registro de aplicação de vacina e retornar a linha completa.
- [ ] `aplicacao.update` — atualizar os campos mutáveis de aplicação de vacina pela chave completa e retornar a linha atualizada.
- [ ] `aplicacao.delete` — excluir registro de aplicação de vacina pela chave completa e retornar a linha removida.

### Voluntário ↔ feira (PARTICIPA)

- [ ] `participa.list` — listar todos os registros de `participa`, com todas as colunas e ordenação pela chave.
- [ ] `participa.insert` — inserir registro de participação de voluntário em feira e retornar a linha completa.
- [ ] `participa.update` — atualizar os campos mutáveis de participação de voluntário em feira pela chave completa e retornar a linha atualizada.
- [ ] `participa.delete` — excluir registro de participação de voluntário em feira pela chave completa e retornar a linha removida.

### Chaves compostas das associações

| Associação | Componentes da chave |
| --- | --- |
| `atua` | `cnpj_abrigo` + `cpf_voluntario` |
| `vinculo` | `cpf_veterinario` + `cnpj_abrigo` |
| `aplicacao` | `id_prontuario` + `id_vacina` + `dose` |
| `participa` | `cpf_voluntario` + `id_feira_adocao` |

## Fotos — 3 queries

- [ ] `foto.get` — receber `id_animal`; retornar zero ou uma linha com `id_animal`, `dados` binários, `mime` e `nome`.
- [ ] `foto.save` — receber, nesta ordem, `id_animal`, bytes, MIME e nome; inserir ou substituir atomicamente a única foto do animal; afetar uma linha e retornar `id_animal`.
- [ ] `foto.delete` — receber `id_animal`; remover a foto se existir; afetar zero ou uma linha, sem exigir retorno. Também é utilizada antes da exclusão do animal.

As consultas de foto dependem da alteração manual do esquema para armazenar os bytes no PostgreSQL. O backend aceita JPEG/PNG de até 5 MiB.

## Outras pendências SQL — fora das 71 queries

- [ ] Criar a estrutura de armazenamento binário da foto, com chave única por animal e FK para ANIMAL.
- [ ] Criar a View de animais disponíveis e integrar uma consulta dedicada à aplicação.
- [ ] Criar e integrar a Procedure de aprovação de adoção, definindo suas responsabilidades em relação ao serviço.
- [ ] Criar os Triggers previstos para adoção, disponibilidade e atualização do peso, compatíveis com as gravações do backend.
- [ ] Complementar as restrições de integridade no banco conforme as regras do domínio.
- [ ] Criar os scripts de população com dados fictícios e uma foto real para demonstração.

## Ordem de implementação

1. Implementar as 4 consultas transacionais e as 16 consultas `list`: essas 20 entradas liberam a carga inicial do frontend.
2. Completar as escritas de abrigo/coordenador e animal/prontuário; verificar o cadastro e a persistência após recarregar.
3. Completar adoção, clínica, vacinação, doações, equipes e feiras.
4. Implementar o esquema e as queries de foto; validar recuperação após reiniciar a aplicação.
5. Implementar e integrar View, Procedure, Triggers e carga; testar rollback, concorrência e persistência reais.
