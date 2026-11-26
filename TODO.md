Atualizado em 26/11/2026.

Situação atual: frontend remoto sincronizado; backend de negócio e integração HTTP implementados. **Todo SQL novo permanece vazio por decisão do projeto.** Cadastro, consultas e foto ainda não persistem até você preencher as queries. A API retorna 501 `SQL_NOT_IMPLEMENTED` com a lista exata das pendências.

Implementação concluída nesta etapa (código, sem SQL):

- [x] Contratos das 16 tabelas, validação de campos, documentos, enums, datas e valores.
- [x] Repositório comum e transação no mesmo cliente, com preflight antes de conectar e rollback/liberação em falhas.
- [x] CRUD dos 12 recursos e rotas de associações, com restrições explícitas de histórico e adoção.
- [x] Abrigo com coordenador; animal com prontuário; capacidade e transferência; pedidos e decisão de adoção.
- [x] Clínica, peso pela última medição, vacinação, doações, equipe e feiras com participantes válidos.
- [x] API de foto JPEG/PNG até 5 MiB com validação de MIME/assinatura, leitura, substituição e exclusão.
- [x] Frontend conectado à API, sem fallback para mock; formulários assíncronos, bloqueio de reenvio e mensagens de erro.
- [x] Sessão de demonstração preservada e identificada como sem autenticação.
- [x] Builds de backend/frontend; 93 testes automatizados e 4 e2e existentes com PostgreSQL real passaram em 26/11/2026.
- [x] Navegador verificado: carga inicial mostra SQL pendente e seus identificadores, sem fingir banco vazio ou sucesso.
- [x] Commits separados com até 200 linhas somadas (adições + remoções), padrão semântico e sufixo ` (🤖)`.

Próximas ações de implementação manual:

- [ ] Preencher começo, commit, rollback e lock em `transactionQueries`.
- [ ] Preencher as 16 consultas `list` e liberar `GET /api/dados`.
- [ ] Preencher as escritas dos cadastros e fluxos, começando por abrigo/coordenador e animal/prontuário.
- [ ] Alterar o esquema para foto binária e preencher `foto.get`, `foto.save`, `foto.delete`.
- [ ] Implementar e integrar View, Procedure e Triggers, compatibilizando responsabilidades com o serviço.
- [ ] Criar carga e validar persistência, rollback e concorrência reais; depois revisar modelos e PDF final.

Guias: [contratos SQL e ordem de trabalho](docs/SQL_BACKEND.md), [64 consultas com parâmetros e retornos](docs/CATALOGO_QUERIES.md), [rotas e regras da API](docs/API.md). Os itens abaixo marcados como código concluído não significam que os critérios de persistência já foram demonstrados.

Entregas já registradas no Git:

- [x] `3fa6bde` — `🔧 chore(docker): configurar PostgreSQL (🤖)`: Compose, volume persistente, inicialização do esquema, exemplo de ambiente e documentação do banco.
- [x] `45d511c` — `✨ feat(nest): conectar PostgreSQL (🤖)`: configuração de ambiente, pool compartilhado, consultas parametrizadas, diagnóstico HTTP e testes.
- [x] Acrescentar o sufixo ` (🤖)` aos dois commits feitos pelo assistente, preservando conteúdo e ordem.

Base documental já disponível:

- [x] Introdução com problema, objetivo e escopo do sistema (página 1).
- [x] Modelo Entidade Relacionamento com 12 entidades de domínio (página 1).
- [x] Modelo relacional com 16 tabelas, incluindo as associações (página 2).
- [x] Script SQL de criação no documento (páginas 3 a 5) e em `backend/database/schema.sql`.
- [x] Definição de chaves automáticas com `SERIAL` no script; geração de ID validada em VACINA no PostgreSQL local em 24/11/2026.
- [x] Declaração inicial do uso de IA para correções dos modelos e recriação/correção do SQL (página 5).
- [x] Estrutura inicial dos 12 resources NestJS gerada e registrada no `AppModule`.

Ainda precisam de revisão os diagramas e sua correspondência com o SQL. Os resources gerados foram desativados no AppModule; a implementação ativa está em `backend/src/api`. O banco local e a conexão estão validados; a persistência de negócio depende das queries manuais.

1. Preparar um banco reproduzível

- [x] Definir e documentar o SGBD: PostgreSQL, decisão confirmada em 24/11/2026. Ambiente local com Docker Compose e imagem `postgres:17-bookworm`, com suporte às Procedures exigidas no trabalho.
- [x] Preparar `compose.yaml` com volume persistente, healthcheck, acesso em localhost e execução inicial de `backend/database/schema.sql`.
- [x] Configurar uma instância local para desenvolvimento e apresentação; serviço `postgres` saudável em `127.0.0.1:5433` no OrbStack. Porta publicada ajustada em 25/11/2026 para evitar conflito com o PostgreSQL nativo na porta 5432, preservando o volume de dados.
- [x] Executar o schema.sql em um banco vazio; inicialização automática concluída no PostgreSQL 17.12.
- [x] Confirmar a criação das 16 tabelas, 16 PKs, 17 FKs e 4 restrições UNIQUE consultando os catálogos do banco.
- [x] Inserir registro em VACINA sem informar o ID e verificar a geração automática; inserção revertida por rollback, sem deixar registros de teste.
- [x] Recriar o container preservando o volume e confirmar a permanência das 16 tabelas e do estado da sequência de IDs.
- [x] Documentar no README como configurar, iniciar, acessar e parar o banco, incluindo persistência e limitações da inicialização automática.
- [x] Disponibilizar `.env.example` compartilhado pelo Compose e pelo NestJS e ignorar `.env` no Git.
- [x] Versionar a base de reconstrução do banco: `compose.yaml`, `.env.example` e `backend/database/schema.sql`, com instruções no README.
- [ ] Acrescentar e versionar os futuros scripts de população, alterações de esquema, View, Procedure e Triggers conforme forem implementados.

Validação local: `docker compose config --quiet`, inicialização com `docker compose up -d --wait`, conexão TCP autenticada dentro do container, consultas aos catálogos, inserção com rollback e recriação do container com volume preservado. O `.env` local foi criado com senha gerada e está ignorado pelo Git. A carga de demonstração e os testes das regras de integridade continuam pendentes.

Critério de conclusão: outra pessoa consegue criar o banco a partir do repositório seguindo instruções explícitas.

2. Completar as regras de integridade

O esquema já define relacionamentos e algumas restrições importantes. Por exemplo, PRONTUARIO.Id_animal é único, e as tabelas associativas têm chaves compostas. Ainda faltam decisões de negócio para orientar o CRUD.
- [x] Definir os valores permitidos para status de animal e pedido de adoção.
- [x] Definir os valores permitidos para espécie, sexo, tipo de doação e tipo de atendimento.
- [x] Definir regras para capacidade, peso, valor de doação e número da dose.
- [x] Definir coerência entre data do pedido e data da decisão.
- [x] Definir como tratar exclusão de registros referenciados: bloquear, remover vínculos ou outra regra justificada.
- [x] Definir quando um animal pode ser adotado e como impedir aprovações incompatíveis.
- [x] Implementar no backend as regras do MER: aprovação adota, indisponibilidade bloqueia pedido e peso segue a última medição. Triggers e validação no banco continuam pendentes.
- [ ] Alinhar a relação ANIMAL–PRONTUARIO entre MER, modelo relacional e implementação. O MER indica 1:1 obrigatório; o modelo relacional traz uma anotação de correção; `Id_animal NOT NULL UNIQUE` impede dois prontuários para o mesmo animal, mas sozinho não garante que todo animal tenha prontuário.
- [ ] Aplicar as validações pertinentes no banco e no backend.
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
- [x] Implementar DomainRepository/UnitOfWork usando DatabaseService, com contratos de consulta. As strings SQL continuam pendentes.
- [ ] Usar parâmetros em todas as consultas dos CRUDs quando forem implementadas.
- [x] Gerar módulos, controllers, services, DTOs e classes de entidade para os 12 resources e registrar seus módulos no `AppModule`.
- [x] Criar tipos e validação em `api/model.ts` e `api/schema.ts`, endpoints de negócio e associações; desativar rotas de exemplo. SQL ainda vazio.
- [x] Preservar CPF, CNPJ e Documento como strings nas novas rotas de domínio, sem conversão numérica.
- [x] Validar campos obrigatórios, identificadores e dados recebidos.
- [x] Tratar registro inexistente, duplicidade, violação de FK e falhas de conexão.
- [x] Implementar executor de transações; preencher as consultas transacionais e validar rollback real continua pendente.
- [x] Configurar a comunicação entre frontend e backend.
- [ ] Garantir que alterações persistam após reiniciar a aplicação.
Critério de conclusão: as operações da API gravam e consultam dados reais, com respostas compreensíveis para sucesso e erro.

4. Implementar o CRUD do domínio

O enunciado pede CRUD para o sistema, mas não determina uma tela independente para cada tabela. O código das operações abaixo está implementado no novo módulo; as consultas e a demonstração com persistência continuam pendentes:

| Área | Resource existente | Tabelas envolvidas | Funcionalidades implementadas em código, aguardando SQL |
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


- [x] Implementar inclusão, leitura, atualização e exclusão onde forem aplicáveis.
- [x] Permitir adicionar e remover vínculos nas tabelas associativas.
- [x] Tratar corretamente as chaves compostas dessas associações.
- [x] Exibir nomes de animais, pessoas e abrigos ao selecionar relacionamentos.
- [x] Definir como corrigir registros de histórico sem quebrar a integridade.
Critério de conclusão: o usuário consegue executar as operações pela interface, e o resultado aparece no banco.

5. Implementar uma funcionalidade envolvendo várias tabelas

A aprovação de adoção foi implementada e testada com executor simulado; as garantias no PostgreSQL ainda precisam ser demonstradas:
- [x] Localizar o pedido e o animal associado.
- [x] Validar que o pedido está pendente e o animal está disponível.
- [x] Atualizar o status e a data de decisão do pedido.
- [x] Atualizar o status do animal para adotado.
- [x] Definir o destino dos outros pedidos pendentes para o mesmo animal.
- [ ] Executar as alterações de forma atômica.
- [ ] Impedir que duas aprovações concorrentes produzam adoções conflitantes.
- [x] Disponibilizar a ação na interface.
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
- [x] Implementar envio do arquivo pelo backend.
- [x] Validar tipo e tamanho.
- [ ] Gravar os bytes no banco.
- [x] Implementar recuperação do arquivo.
- [x] Exibir a foto na interface.
- [ ] Incluir pelo menos um arquivo real na demonstração.
Critério de conclusão: a imagem continua recuperável a partir do banco após reiniciar a aplicação. Guardar somente uma URL ou caminho não atende ao requisito de dado binário no banco.

8. Construir a interface gráfica
- [x] Substituir a tela padrão do Vite pela aplicação PetMatch.
- [x] Criar navegação entre as áreas implementadas.
- [x] Criar listagens, formulários de cadastro, edição e visualização.
- [x] Implementar exclusão com confirmação e explicação quando houver dependências.
- [x] Usar seletores para relacionamentos, evitando exigir IDs digitados pelo usuário.
- [x] Mostrar mensagens de sucesso e erros compreensíveis.
- [x] Tratar carregamento e listas vazias.
- [ ] Integrar a aprovação de adoção, a consulta à View e o envio da foto.
Critério de conclusão: uma pessoa leiga consegue operar o CRUD sem terminal, comandos SQL ou chamadas manuais à API.

9. Popular o banco e verificar os fluxos

- [x] Validar o build do backend e executar 35 testes unitários em 25/11/2026.
- [x] Executar 4 testes e2e com PostgreSQL real: rota inicial, diagnóstico HTTP, parâmetros SQL e acesso às 16 tabelas.
- [x] Executar o lint sem erros; os avisos restantes são de parâmetros não usados nos services gerados.
- [x] Verificar a inicialização e o encerramento da API compilada com conexão real, sem manter o processo de teste ativo.
- [ ] Criar um script de população com dados fictícios coerentes.
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

As verificações cobrem infraestrutura, lógica com executores simulados, contratos HTTP, cliente frontend e tela de SQL pendente. Não demonstram CRUD persistido, concorrência nem rollback de negócio no PostgreSQL; esses testes continuam pendentes.

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
- [ ] Atualizar os diagramas após alterações feitas para o binário ou outros requisitos.
- [ ] Criar o diagrama da persistência usando uma tabela concreta, como ANIMAL.
- [ ] Mostrar nesse diagrama o caminho: tela → API/controller → serviço → acesso a dados → tabela.
- [ ] Complementar a declaração de IA com usos posteriores efetivamente realizados, incluindo apoio ao planejamento e à implementação, quando aplicável, indicando onde e com qual objetivo.
- [ ] Substituir a identificação “Entrega da primeira parte do projeto” pela identificação da entrega final.
- [ ] Inserir o endereço do GitHub no início do PDF; ele ainda não aparece no documento atual.
- [ ] Atualizar o SQL reproduzido no PDF para que não divirja dos scripts finais do repositório, caso essa seção seja mantida.
- [ ] Exportar um único PDF final com introdução, MER, modelo relacional, diagrama de mapeamento/persistência e declaração de IA atualizada.
- [ ] Verificar a legibilidade dos diagramas no PDF final, especialmente o MER atualmente comprimido junto à introdução na página 1.
- [x] Documentar no README a instalação das dependências, configuração do ambiente, criação do banco, execução do NestJS, diagnóstico da conexão e comandos de teste.
- [ ] Complementar o README com os scripts de população e o roteiro de uso dos CRUDs quando estiverem implementados.
- [ ] Confirmar SQL e código final disponíveis no GitHub.
- [x] Versionar o documento em `docs/` e o TODO; ambos constam no commit `6065f6e`. As atualizações de Docker e conexão foram incluídas nos dois commits registrados acima.
- [ ] Confirmar a aprovação do tema e organizar a apresentação com todos os integrantes.
- [ ] Confirmar a submissão do PDF final no Aprender3 na data correspondente ao grupo.

O documento da primeira parte foi localizado em `docs/Projeto Final - Banco de Dados.pdf`. A existência do arquivo não confirma a submissão anterior nem a aprovação do tema.

Próximas prioridades: preencher queries transacionais e de leitura → escritas de abrigo e animal → validar primeiro fluxo persistido pela interface → demais queries → esquema binário → View/Procedure/Triggers → carga, concorrência e documentação final.

A especificação marca a apresentação final para 1º e 3 de dezembro de 2026 e condiciona a avaliação ao projeto estar funcionando. O primeiro marco deve ser conseguir cadastrar, listar, editar e excluir um animal pela interface, com persistência real e vínculo válido com um abrigo.

