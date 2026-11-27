
- [x] Introdução com problema, objetivo e escopo do sistema (página 1).
- [x] Modelo Entidade Relacionamento com 12 entidades de domínio (página 1).
- [x] Modelo relacional com 16 tabelas, incluindo as associações (página 2).
- [x] Script SQL de criação no documento (páginas 3 a 5) e em `backend/database/schema.sql`.
- [x] Definição de chaves automáticas com `SERIAL` no script; geração de ID validada em VACINA no PostgreSQL local em 24/11/2026.
- [x] Declaração inicial do uso de IA para correções dos modelos e recriação/correção do SQL (página 5).
- [x] Estrutura inicial dos 12 resources NestJS gerada e registrada no `AppModule`.

Ainda precisam de revisão os diagramas e sua correspondência com o SQL. Os resources têm DTOs/classes de entidade vazios e services com respostas de exemplo; o CRUD com persistência permanece pendente. O banco local foi iniciado em 24/11/2026 e a conexão do NestJS foi validada em 25/11/2026, incluindo a rota HTTP de diagnóstico. Os fluxos de negócio ainda precisam ser implementados e testados. Em 26/11/2026 o `schema.sql` recebeu as regras de integridade (seção 2), testadas em um PostgreSQL 17 limpo.

1. Preparar um banco reproduzível

- [x] Definir e documentar o SGBD: PostgreSQL, decisão confirmada em 24/11/2026. Ambiente local com Docker Compose e imagem `postgres:17-bookworm`, com suporte às Procedures exigidas no trabalho.
- [x] Preparar `compose.yaml` com volume persistente, healthcheck, acesso em localhost e execução inicial de `backend/database/schema.sql`.
- [x] Configurar uma instância local para desenvolvimento e apresentação; serviço `postgres` saudável em `127.0.0.1:5433` no OrbStack. Porta publicada ajustada em 25/11/2026 para evitar conflito com o PostgreSQL nativo na porta 5432, preservando o volume de dados.
- [x] Executar o schema.sql em um banco vazio; inicialização automática concluída no PostgreSQL 17.12.
- [x] Confirmar a criação das 16 tabelas, 16 PKs, 17 FKs e 4 restrições UNIQUE consultando os catálogos do banco. Desde 26/11/2026 são 3 UNIQUE de coluna; o e-mail do adotante passou para o índice único `ux_adotante_email`.
- [x] Inserir registro em VACINA sem informar o ID e verificar a geração automática; inserção revertida por rollback, sem deixar registros de teste.
- [x] Recriar o container preservando o volume e confirmar a permanência das 16 tabelas e do estado da sequência de IDs.
- [x] Documentar no README como configurar, iniciar, acessar e parar o banco, incluindo persistência e limitações da inicialização automática.
- [x] Disponibilizar `.env.example` para o Compose e ignorar `.env` no Git.
- [ ] Manter os scripts necessários à reconstrução do banco versionados.

Validação local: `docker compose config --quiet`, inicialização com `docker compose up -d --wait`, conexão TCP autenticada dentro do container, consultas aos catálogos, inserção com rollback e recriação do container com volume preservado. O `.env` local foi criado com senha gerada e está ignorado pelo Git. A carga de demonstração continua pendente. As regras de integridade adicionadas em 26/11/2026 foram testadas em um container descartável; quem já tinha o volume criado precisa recriá-lo (`docker compose down -v`, apagando os dados locais) ou aplicar as mudanças com `ALTER TABLE`.

Critério de conclusão: outra pessoa consegue criar o banco a partir do repositório seguindo instruções explícitas.

2. Completar as regras de integridade

Implementado em 26/11/2026 no `schema.sql` (branch `feat/schema-integridade`). As decisões estão resumidas no relatório de decisões do schema compartilhado com a equipe.
- [x] Definir os valores permitidos para status de animal e pedido de adoção: CHECKs `ck_animal_status` e `ck_pedido_status`, iguais a `frontend/src/types/db.ts`.
- [x] Definir os valores permitidos para espécie, sexo, tipo de doação e tipo de atendimento: CHECKs em ANIMAL, VACINA, DOACAO e ATENDIMENTO. CPF, CNPJ, CEP e UF também têm formato validado.
- [x] Definir regras para capacidade, peso, valor de doação e número da dose: capacidade ≥ 1, peso > 0, dose ≥ 1; doação em dinheiro exige valor > 0 e doação de insumo exige descrição e valor nulo.
- [x] Definir coerência entre data do pedido e data da decisão: pendente sem decisão, aprovado/reprovado com decisão, decisão ≥ pedido. O trigger `trg_pedido_data_decisao` preenche a data atual quando ela não é informada.
- [x] Definir como tratar exclusão de registros referenciados: `ON DELETE` nas 17 FKs. Animal apaga prontuário, atendimentos, aplicações e pedidos; abrigo com animais ou doações é bloqueado; doador excluído torna a doação anônima; associações somem com a pessoa; veterinário com atendimentos, adotante com pedidos e vacina aplicada são bloqueados.
- [ ] Definir quando um animal pode ser adotado e como impedir aprovações incompatíveis. Parcial: os índices únicos parciais garantem no máximo um pedido aprovado por animal (inclusive com aprovações simultâneas) e um pedido pendente por adotante e animal. Falta a regra de disponibilidade, ligada à seção 6.
- [ ] Implementar as regras já anotadas no MER: aprovação de pedido marca o animal como adotado; pedido para animal indisponível é bloqueado; peso informado no atendimento atualiza o prontuário.
- [x] Implementar a relação ANIMAL–PRONTUARIO 1:1 obrigatória: `trg_animal_cria_prontuario` cria o prontuário ao inserir o animal e `trg_prontuario_bloqueia_exclusao` impede excluir o prontuário sem o animal. Seed e backend não devem inserir prontuário, apenas atualizá-lo. Ainda falta alinhar o MER e o modelo relacional (seção 10).
- [ ] Aplicar as validações pertinentes no banco e no backend. Banco concluído; falta o backend (DTOs, erros `23505`/`23503`/`23514` traduzidos para HTTP, buscas por e-mail com `lower()`).
- [x] Indexar as FKs não cobertas por PK ou UNIQUE: 12 índices `ix_*`.
- [x] Definir valores padrão: animal começa `disponivel`, pedido começa `pendente` com a data atual, prontuário abre na data atual.
As regras anotadas no MER fazem parte do modelo apresentado pelo grupo. As demais são recomendações para tornar o domínio consistente; o enunciado exige demonstrar integridade, mas não prescreve cada regra de negócio.

Critério de conclusão: dados inválidos e operações incompatíveis são rejeitados de forma previsível, sem deixar registros inconsistentes.

3. Implementar a camada de persistência e a API

- [x] Instalar `@nestjs/config`, `pg` e os tipos do driver; carregar as credenciais do mesmo `.env` da raiz usado pelo Compose.
- [x] Validar credenciais obrigatórias, host e portas; configuração local aponta para `127.0.0.1:5433`.
- [x] Criar `DatabaseModule` e `DatabaseService` com pool compartilhado, timeout de conexão, verificação na inicialização e encerramento das conexões ao fechar a aplicação.
- [x] Disponibilizar `DatabaseService.query(sql, values)` para consultas parametrizadas e validar que textos semelhantes a SQL são tratados como dados.
- [x] Implementar `GET /health/database` com consulta real ao PostgreSQL; resposta HTTP 200 quando acessível e erro 503 sem detalhes internos quando indisponível.
- [x] Validar a API compilada em uma porta temporária: inicialização com conexão real, diagnóstico HTTP 200 e encerramento por SIGTERM sem manter o processo ativo.
- [x] Documentar no README a inicialização do NestJS, verificação da conexão e uso do `DatabaseService` nos futuros repositories.
- [ ] Implementar os repositories das entidades usando o `DatabaseService`; a infraestrutura de conexão está pronta, mas as consultas do domínio ainda não existem.
- [ ] Usar parâmetros em todas as consultas dos CRUDs quando forem implementadas.
- [x] Gerar módulos, controllers, services, DTOs e classes de entidade para os 12 resources e registrar seus módulos no `AppModule`.
- [ ] Preencher os DTOs e tipos de dados, substituir respostas de exemplo por consultas SQL e implementar os endpoints de negócio e das associações.
- [ ] Adaptar os identificadores gerados: manter CPF, CNPJ e Documento como strings nos resources `adoptant`, `volunteer`, `veterinarian`, `shelter` e `donor`, removendo a conversão numérica `+id` nesses casos.
- [ ] Validar campos obrigatórios, identificadores e dados recebidos.
- [ ] Tratar registro inexistente, duplicidade, violação de FK e falhas de conexão.
- [ ] Implementar transações para operações que precisam ser concluídas integralmente.
- [ ] Configurar a comunicação entre frontend e backend.
- [ ] Garantir que alterações persistam após reiniciar a aplicação.
Critério de conclusão: as operações da API gravam e consultam dados reais, com respostas compreensíveis para sucesso e erro.

4. Implementar o CRUD do domínio

O enunciado pede CRUD para o sistema, mas não determina uma tela independente para cada tabela. Os resources abaixo já existem como estrutura inicial; as funcionalidades continuam pendentes:

| Área | Resource existente | Tabelas envolvidas | Funcionalidades pendentes |
| --- | --- | --- | --- |
| Abrigos | `shelter` | ABRIGO | Cadastrar, listar, detalhar, editar e excluir conforme dependências |
| Animais | `animals` | ANIMAL | CRUD com seleção do abrigo e manutenção dos dados do animal |
| Adotantes | `adoptant` | ADOTANTE | CRUD dos interessados em adoção |
| Pedidos de adoção | `adoption` | PEDIDO_ADOCAO | Criar, consultar, decidir e tratar correções/exclusões conforme regra |
| Doadores e doações | `donor`, `donation` | DOADOR, DOACAO | CRUD de doadores e registro de doações vinculadas ao abrigo, inclusive anônimas conforme o modelo |
| Voluntários | `volunteer` | VOLUNTARIO, ATUA | CRUD de voluntários e gestão dos vínculos com abrigos |
| Veterinários | `veterinarian` | VETERINARIO, VINCULO | CRUD de veterinários e gestão dos vínculos com abrigos |
| Prontuários | `medical_record` | PRONTUARIO | Consultar e manter prontuário associado ao animal |
| Atendimentos | `service` | ATENDIMENTO | Registrar e consultar atendimento ligado ao prontuário e veterinário |
| Vacinação | `vaccine` | VACINA, APLICACAO | CRUD de vacinas e gestão de aplicações, doses, datas e lotes |
| Feiras | `adoption_fair` | FEIRA_ADOCAO, PARTICIPA | CRUD de feiras e gestão dos voluntários participantes |


- [ ] Implementar inclusão, leitura, atualização e exclusão onde forem aplicáveis.
- [ ] Permitir adicionar e remover vínculos nas tabelas associativas.
- [ ] Tratar corretamente as chaves compostas dessas associações.
- [ ] Exibir nomes de animais, pessoas e abrigos ao selecionar relacionamentos.
- [ ] Definir como corrigir registros de histórico sem quebrar a integridade.
Critério de conclusão: o usuário consegue executar as operações pela interface, e o resultado aparece no banco.

5. Implementar uma funcionalidade envolvendo várias tabelas

Uma boa candidata é aprovar um pedido de adoção:
- [ ] Localizar o pedido e o animal associado.
- [ ] Validar que o pedido está pendente e o animal está disponível.
- [ ] Atualizar o status e a data de decisão do pedido.
- [ ] Atualizar o status do animal para adotado.
- [ ] Definir o destino dos outros pedidos pendentes para o mesmo animal.
- [ ] Executar as alterações de forma atômica.
- [ ] Impedir que duas aprovações concorrentes produzam adoções conflitantes.
- [ ] Disponibilizar a ação na interface.
- [ ] Demonstrar que uma falha não deixa apenas parte das alterações gravada.
Critério de conclusão: uma ação do usuário modifica corretamente PEDIDO_ADOCAO e ANIMAL, mantendo as relações válidas.

6. Criar e utilizar View, Procedure e Trigger

O MER já prevê triggers para marcar o animal como adotado após aprovação e bloquear pedidos para animais indisponíveis. Também registra a atualização do peso do prontuário pelo atendimento. Essas anotações documentam regras, mas não equivalem a objetos SQL implementados. O enunciado exige pelo menos um Trigger; implementar as regras prometidas no MER ou revisar explicitamente o modelo para refletir a solução adotada.

| Recurso | Proposta ou regra documentada | Demonstração |
| --- | --- | --- |
| View | Proposta: `vw_animais_disponiveis`, reunindo animal e informações do abrigo | Listagem de animais disponíveis consultando a View |
| Procedure | Proposta: `aprovar_adocao`, coordenando a decisão sobre o pedido em transação | Ação na interface que chama a Procedure pelo backend |
| Trigger de adoção | Previsto no MER: aprovação de pedido marca o animal como adotado | Aprovar pedido e mostrar a alteração automática do animal |
| Trigger de disponibilidade | Previsto no MER: bloquear pedido para animal indisponível | Tentar registrar pedido inválido e mostrar a rejeição |
| Atualização de peso | Regra do MER; proposta de implementação por Trigger após atendimento com peso informado | Registrar atendimento e mostrar a atualização do prontuário |


- [ ] Versionar a criação dos três objetos SQL.
- [ ] Integrar a View a uma consulta da aplicação.
- [ ] Criar uma Procedure do SGBD e demonstrar sua chamada.
- [ ] Criar o Trigger e definir precisamente quando ele deve agir.
- [ ] Definir a divisão de responsabilidades entre Procedure e triggers de adoção, incluindo rejeição de aprovações incompatíveis e tratamento de concorrência.
- [ ] Evitar regras duplicadas e contraditórias entre backend, Procedure e Trigger.
- [ ] Preparar exemplos de antes e depois para apresentação.
Critério de conclusão: os três recursos existem no banco e seu uso pode ser demonstrado. A exigência é de utilização, portanto vale mostrar mais que os comandos de criação.

7. Armazenar um dado binário no banco

A opção mais natural é uma foto do animal.
- [ ] Acrescentar armazenamento binário ao modelo, em campo ou tabela relacionada.
- [ ] Guardar os metadados necessários, como tipo do arquivo e nome.
- [ ] Implementar envio do arquivo pelo backend.
- [ ] Validar tipo e tamanho.
- [ ] Gravar os bytes no banco.
- [ ] Implementar recuperação do arquivo.
- [ ] Exibir a foto na interface.
- [ ] Incluir pelo menos um arquivo real na demonstração.
Critério de conclusão: a imagem continua recuperável a partir do banco após reiniciar a aplicação. Guardar somente uma URL ou caminho não atende ao requisito de dado binário no banco.

8. Construir a interface gráfica
- [ ] Substituir a tela padrão do Vite pela aplicação PetMatch.
- [ ] Criar navegação entre as áreas implementadas.
- [ ] Criar listagens, formulários de cadastro, edição e visualização.
- [ ] Implementar exclusão com confirmação e explicação quando houver dependências.
- [ ] Usar seletores para relacionamentos, evitando exigir IDs digitados pelo usuário.
- [ ] Mostrar mensagens de sucesso e erros compreensíveis.
- [ ] Tratar carregamento e listas vazias.
- [ ] Integrar a aprovação de adoção, a consulta à View e o envio da foto.
Critério de conclusão: uma pessoa leiga consegue operar o CRUD sem terminal, comandos SQL ou chamadas manuais à API.

9. Popular o banco e verificar os fluxos
- [ ] Criar um script de população com dados fictícios coerentes, respeitando os CHECKs, a ordem das FKs e o prontuário criado por trigger. Se IDs forem informados manualmente, ajustar as sequências com `setval`.
- [ ] Garantir pelo menos 10 registros nas tabelas principais.
- [ ] Justificar quantidades menores quando a natureza dos dados exigir.
- [ ] Popular as associações com exemplos suficientes para demonstrar os relacionamentos.
- [ ] Incluir animais e pedidos em situações diferentes.
- [ ] Incluir prontuários, atendimentos, vacinas, aplicações, doações e participações.
- [ ] Verificar cadastro, consulta, edição e exclusão pelo frontend.
- [ ] Verificar rejeição de duplicidades e referências inexistentes.
- [ ] Verificar rollback da operação sobre várias tabelas.
- [ ] Verificar View, Procedure, Trigger e recuperação do binário.
- [ ] Ensaiar a inicialização completa em um ambiente limpo.
Os testes incluem o exemplo “Hello World”, instanciação dos controllers/services, validação de configuração e tratamento de falha do diagnóstico. Em 25/11/2026, passaram 35 testes unitários e 4 testes e2e com PostgreSQL real (rota inicial, diagnóstico HTTP, parâmetros SQL e acesso às 16 tabelas). O build passou e o lint terminou sem erros, com avisos de parâmetros não usados nos services gerados. Ainda não demonstram CRUD com persistência nem regras de negócio do PetMatch.

10. Preparar documentação e entrega

Reaproveitar o documento existente como base da entrega final. Introdução, modelos, SQL e indicação inicial de IA já estão presentes; faltam revisões e os itens específicos da entrega final.

- [x] Escrever a introdução com problema, objetivo e escopo do PetMatch (página 1).
- [x] Incluir o MER no documento (página 1).
- [x] Incluir o modelo relacional no documento (página 2).
- [x] Incluir o script SQL de criação no documento (páginas 3 a 5).
- [x] Incluir a declaração inicial de uso de IA (página 5).
- [ ] Disponibilizar ou identificar os arquivos editáveis dos diagramas e a ferramenta de modelagem usada, para permitir atualização.
- [ ] Revisar os tipos no modelo relacional: CPF, CNPJ e Documento aparecem como INT, enquanto o SQL usa CHAR/VARCHAR; Valor e Peso aparecem como FLOAT, enquanto o SQL usa NUMERIC; campos como Observacoes, Diagnostico e Tratamento também precisam ser alinhados aos tipos SQL.
- [ ] Corrigir as cardinalidades e a anotação de revisão da relação ANIMAL–PRONTUARIO, de acordo com a regra efetivamente implementada.
- [ ] Conferir PKs, FKs, unicidade, nulabilidade e correspondência entre MER, modelo relacional e script final.
- [ ] Atualizar os diagramas após alterações feitas para o binário ou outros requisitos, incluindo as regras de 26/11/2026: prontuário 1:1 obrigatório, regras de exclusão e e-mail único sem diferenciar maiúsculas.
- [ ] Criar o diagrama da persistência usando uma tabela concreta, como ANIMAL.
- [ ] Mostrar nesse diagrama o caminho: tela → API/controller → serviço → acesso a dados → tabela.
- [ ] Complementar a declaração de IA com usos posteriores efetivamente realizados, incluindo apoio ao planejamento e à implementação, quando aplicável, indicando onde e com qual objetivo.
- [ ] Substituir a identificação “Entrega da primeira parte do projeto” pela identificação da entrega final.
- [ ] Inserir o endereço do GitHub no início do PDF; ele ainda não aparece no documento atual.
- [ ] Atualizar o SQL reproduzido no PDF para que não divirja dos scripts finais do repositório, caso essa seção seja mantida.
- [ ] Exportar um único PDF final com introdução, MER, modelo relacional, diagrama de mapeamento/persistência e declaração de IA atualizada.
- [ ] Verificar a legibilidade dos diagramas no PDF final, especialmente o MER atualmente comprimido junto à introdução na página 1.
- [ ] Atualizar as instruções de instalação, configuração, criação do banco, população e execução.
- [ ] Confirmar SQL e código final disponíveis no GitHub.
- [ ] Versionar o documento em `docs/` e o TODO; ambos ainda estavam sem rastreamento no Git na inspeção de 24/11/2026.
- [ ] Confirmar a aprovação do tema e organizar a apresentação com todos os integrantes.
- [ ] Confirmar a submissão do PDF final no Aprender3 na data correspondente ao grupo.

O documento da primeira parte foi localizado em `docs/Projeto Final - Banco de Dados.pdf`. A existência do arquivo não confirma a submissão anterior nem a aprovação do tema.

Prioridade de execução: banco reproduzível → persistência → primeiro CRUD completo pela interface → demais operações do domínio → adoção integrada e recursos SQL → binário → carga e verificações → documentação final. A revisão dos diagramas existentes e a complementação do PDF podem avançar em paralelo.

A especificação marca a apresentação final para 1º e 3 de dezembro de 2026 e condiciona a avaliação ao projeto estar funcionando. O primeiro marco deve ser conseguir cadastrar, listar, editar e excluir um animal pela interface, com persistência real e vínculo válido com um abrigo.

