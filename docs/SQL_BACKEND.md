# SQL pendente do backend

Atualizado em 26/11/2026. Nenhum SQL novo foi implementado nesta etapa. O esquema existente foi preservado. O código de negócio e a integração HTTP estão implementados; o sistema só persistirá dados quando você preencher as consultas abaixo.

## Onde escrever

- `backend/src/api/domain.queries.ts`: objeto `sql`, com quatro strings por tabela: `list`, `insert`, `update`, `delete`.
- No mesmo arquivo, `transactionQueries`: começo, confirmação, reversão e bloqueio transacional, também vazios.
- `backend/src/api/photo.queries.ts`: leitura, substituição e exclusão de foto, também vazios.
- `backend/src/api/schema.ts`: ordem canônica dos campos, tipos de entrada, limites, enums e chaves.
- [CATALOGO_QUERIES.md](./CATALOGO_QUERIES.md): parâmetros ordenados, finalidade e retorno de cada uma das 64 consultas de domínio.
- [API.md](./API.md): rotas, corpos das operações e regras de negócio.

Preencha cada string individualmente com uma consulta parametrizada. O backend fornece os valores separadamente ao driver. Não concatene valores de usuário no texto da consulta. Nenhum ORM ou gerador de SQL é utilizado.

## Contrato comum das consultas

Cada `list` lê a tabela inteira, sem joins, filtros nem paginação, com ordenação crescente por todos os campos da chave primária. Deve devolver todas as colunas com os nomes em minúsculas. Não devolva linhas duplicadas, agrupamentos ou dados de outra tabela.

Cada `insert` cria exatamente uma linha. As tabelas com `SERIAL` recebem o ID do banco, nunca do frontend. Deve devolver a linha completa criada e `rowCount = 1`.

Cada `update` substitui todos os campos mutáveis de exatamente uma linha, identificada por sua chave completa. Os parâmetros são os campos mutáveis na ordem do schema, seguidos dos campos da chave. A chave não pode mudar. Deve devolver a linha completa atualizada e `rowCount = 1`.

Cada `delete` recebe todos os componentes da chave na ordem indicada, remove exatamente uma linha e devolve a linha completa removida e `rowCount = 1`. Não acrescente cascatas escondidas: as exclusões autorizadas são coordenadas pelo serviço.

Uma gravação com retorno ausente, múltiplo ou tipos incompatíveis falha e provoca rollback. Strings NUMERIC do `pg` são convertidas em números; DATE vira `YYYY-MM-DD`; CPF, CNPJ, CEP e documentos continuam strings com zeros à esquerda. Os metadados `number` do catálogo representam INT/SERIAL ou NUMERIC conforme `schema.sql`; o driver recebe números JavaScript em ambos os casos. `nullable` aceita null, não string vazia.

O catálogo inclui operações genéricas que não estão expostas isoladamente na API. Exemplo: `prontuario.insert` é executada somente junto com `animal.insert`; `pedido_adocao.update` só no fluxo de decisão.

## Transação e concorrência — implementar primeiro

| ID | Parâmetros | O que deve fazer | Retorno |
| --- | --- | --- | --- |
| `transaction.begin` | nenhum | Abrir transação READ COMMITTED no cliente dedicado | sem linhas exigidas |
| `transaction.lock` | nenhum | Adquirir advisory lock **transacional exclusivo**, com uma chave constante escolhida para o PetMatch | resultado ignorado |
| `transaction.commit` | nenhum | Confirmar todas as alterações e liberar o lock | sem linhas exigidas |
| `transaction.rollback` | nenhum | Desfazer todas as alterações e liberar o lock | sem linhas exigidas |

A mesma chave de lock deve ser usada por TODAS as operações de escrita, leitura de snapshot e futuros scripts/procedures concorrentes. O lock vem antes de qualquer leitura de domínio e permanece até confirmar ou reverter. READ COMMITTED é necessário para que as consultas posteriores ao lock vejam as alterações de quem o liberou. Não use um lock de sessão: ele sobreviveria à transação e ficaria retido pelo pool.

A aplicação lê as 16 tabelas sequencialmente, no mesmo cliente, depois do lock. Os serviços validam o snapshot consistente e gravam somente os registros envolvidos. A execução serializada protege aprovação de adoção, capacidade, duplicidade de dose e criação de vínculos mesmo quando a linha ainda não existe. Scripts externos que ignorarem esse protocolo poderão violar as regras; restrições e triggers do banco continuam sendo sua responsabilidade.

Essa escolha simplifica a correção para o volume do trabalho acadêmico, mas serializa operações e lê tabelas inteiras. Para crescimento, substituir por consultas focadas, paginação e locks por recurso, com testes concorrentes antes de remover a proteção atual.

Antes de conectar, o preflight verifica as quatro consultas transacionais, as 16 leituras e o conjunto declarado de escritas do fluxo. Alguns conjuntos são conservadores e incluem alternativas de criação/edição/exclusão do mesmo domínio. A resposta 501 lista exatamente o conjunto faltante; implemente todas as entradas listadas para liberar aquela operação. Nenhuma string vazia chega ao driver.

## Operações envolvendo mais de uma tabela

| Fluxo | Ordem e invariantes |
| --- | --- |
| Registrar abrigo | validar CNPJ/capacidade; criar ABRIGO; criar/atualizar VOLUNTARIO coordenador; criar ATUA com função Coordenação |
| Criar animal | validar abrigo/capacidade e dados; criar ANIMAL; usar ID retornado para criar PRONTUARIO obrigatório |
| Editar/transferir animal | destino precisa comportar o animal; validar datas, espécie e histórico; atualizar prontuário e animal; adoção concluída não pode ser revertida/transferida |
| Excluir animal | bloquear histórico clínico, pedidos e animal adotado; remover foto, prontuário vazio e animal |
| Solicitar adoção | animal disponível; sem pedido pendente repetido; e-mail não pertence a outro CPF; upsert do adotante e criação de pedido pendente com data do servidor |
| Decidir pedido | pedido ainda pendente; aprovação exige animal disponível; marcar animal adotado, reprovar demais pendentes e registrar decisão/data; qualquer falha reverte tudo |
| Atendimento | veterinário vinculado ao abrigo, prontuário existente e data coerente; gravar/corrigir/remover atendimento; recalcular peso pela última medição, data e ID decrescentes |
| Aplicação | validar espécie, data, dose positiva e chave composta única; criar vacina se necessário e registrar aplicação com o ID retornado |
| Doação | dinheiro com valor positivo ou insumo com descrição e valor null; doador opcional; upsert doador e gravação da doação |
| Equipe | upsert pessoa e vínculo; CRMV único; remover ATUA também remove participações nas feiras desse abrigo; remover VINCULO não apaga atendimentos |
| Feira | participantes devem integrar a equipe do abrigo; criar/editar feira e substituir PARTICIPA; excluir feira limpa apenas seus participantes |

O peso do prontuário pode ser informado manualmente enquanto não há medições clínicas. Após manutenção de atendimentos, a fonte é o histórico: última medição não nula por data e ID, ou null se nenhuma resta. Não copiar indiscriminadamente o peso do atendimento recém-enviado, pois ele pode ser retroativo.

As queries de escrita devem seguir os dados fornecidos pelo serviço. Não alterar outros registros ou criar entidades adicionais silenciosamente. Se futuramente triggers/procedures assumirem parte dessas alterações, ajustar o serviço e seus testes para não duplicar responsabilidades.

## Foto: alteração de esquema ainda a fazer

O schema atual não contém o armazenamento de foto. Crie manualmente uma estrutura que garanta:

- Um registro por animal, chave/UNIQUE `id_animal` e FK para ANIMAL.
- `dados` binário (BYTEA), obrigatório; `mime` obrigatório para JPEG/PNG; `nome` obrigatório, até 120 caracteres.
- Tamanho de 1 byte a 5 MiB, verificado pela aplicação e, idealmente, por restrição no banco.
- Exclusão explicitamente coordenada pelo serviço, antes de excluir o animal.

| ID | Parâmetros em ordem | Comportamento e retorno |
| --- | --- | --- |
| `foto.get` | $1 id_animal inteiro | 0 ou 1 linha: id_animal, dados Buffer, mime, nome. Ausência da foto vira 404 |
| `foto.save` | $1 id_animal inteiro; $2 dados Buffer; $3 mime texto; $4 nome texto | Inserir ou substituir a foto do animal atomicamente. Exatamente uma linha com id_animal; rowCount 1 |
| `foto.delete` | $1 id_animal inteiro | Remover se existir; idempotente, rowCount 0 ou 1; retorno não utilizado |

O envio é multipart, campo `foto`, via PUT. A aplicação confere MIME, assinatura inicial e tamanho; isso não equivale a uma decodificação completa da imagem. A leitura devolve bytes com Content-Type e sem cache. A foto não entra em `/api/dados` nem é armazenada em memória como persistência alternativa.

## View, Procedure, Triggers e carga — responsabilidade SQL

Esses objetos ainda NÃO existem por esta implementação e não são chamados automaticamente:

- View de animais disponíveis: reunir dados do animal e abrigo para o catálogo, filtrando disponibilidade. Depois integrar uma query dedicada; não substituir `animal.list` por uma consulta filtrada, pois o snapshot precisa de todos os status.
- Procedure de aprovação: receber o pedido e realizar a transição com as mesmas validações, rejeição de concorrentes e protocolo de lock. Definir se ela ou o serviço será responsável por cada alteração antes de integrar sua chamada.
- Triggers: impedir pedidos para animal indisponível, garantir coerência da adoção e atualizar peso conforme histórico. Compatibilizar com as operações explícitas do backend; não duplicar gravações de status/peso sem ajustar o contrato.
- Restrições adicionais: enums, valores positivos, datas coerentes, capacidade e integridade ANIMAL–PRONTUARIO. A validação no backend não protege comandos SQL executados diretamente.
- Carga: dados fictícios coerentes, quantidades exigidas na especificação, vínculos, pedidos em estados variados e uma foto real. Não foram criados inserts ou seeds.

## Ordem prática para completar e verificar

1. Implementar as quatro consultas transacionais e as 16 leituras. `/api/dados` deve responder 200 com as 16 arrays, inclusive vazias; a interface passa a abrir.
2. Implementar escritas de ABRIGO, VOLUNTARIO e ATUA; cadastrar o primeiro abrigo pela interface e conferir persistência após recarregar.
3. Implementar ANIMAL e PRONTUARIO; testar criação atômica, capacidade, transferência e rollback provocado.
4. Completar ADOTANTE, PEDIDO_ADOCAO e edição de ANIMAL; testar duas aprovações concorrentes e conferir um único aprovado.
5. Completar clínica, vacinação, doações, equipes e feiras; testar duplicidades, FKs, exclusões bloqueadas e recalcular peso com datas retroativas.
6. Alterar esquema da foto e implementar as três queries; enviar, substituir, reiniciar aplicação/container, ler e excluir o binário.
7. Implementar e integrar View/Procedure/Triggers, ajustar responsabilidades e testar SQL direto, concorrência e rollback com banco real.
8. Criar carga e roteiro de apresentação; atualizar modelos e PDF final.

Os testes novos usam executores simulados e não comprovam SQL, concorrência real ou persistência de negócio. Os quatro e2e existentes comprovam somente a conexão, saúde HTTP, parâmetros e acesso ao esquema inicial.
