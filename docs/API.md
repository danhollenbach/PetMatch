# API PetMatch

Base local: `http://localhost:3000/api`. O Vite encaminha `/api` e `/health` para `127.0.0.1:3000`; se mudar a porta da API, ajuste `frontend/vite.config.ts`. Em uma publicação futura, servir frontend e API na mesma origem ou configurar proxy/CORS explicitamente.

O modo abrigo é uma sessão de demonstração. Não há login, autorização ou isolamento de dados entre usuários. O snapshot contém os dados cadastrais necessários ao protótipo; usar somente com dados fictícios no ambiente local.

## Organização

Tela → cliente HTTP → controller → DomainService → funções de negócio → DomainRepository/UnitOfWork → QueryRunner → DatabaseService → PostgreSQL.

Os módulos gerados anteriormente por `nest resource` continuam no repositório como scaffolds, mas foram retirados do AppModule: seus endpoints de exemplo não estão expostos. O módulo ativo de domínio está em `backend/src/api`, com contratos tipados, validação comum e regras separadas por área.

Todas as consultas novas estão vazias. [SQL_BACKEND.md](./SQL_BACKEND.md) explica como implementá-las; não confundir a disponibilidade de uma rota com persistência já funcional.

## Leitura e CRUD

- `GET /dados`: objeto com as 16 arrays de `Database` em `model.ts`, incluindo arrays vazias. Fotos não entram nesse JSON.
- `GET /:recurso`: lista completa, ordenada pela chave primária.
- `GET /:recurso/:chave`: registro completo, ou 404.
- `POST /:recurso`: criação quando permitida, 201.
- `PUT /:recurso/:chave`: substituição completa dos dados mutáveis, 200. Não há PATCH parcial.
- `DELETE /:recurso/:chave`: exclusão permitida, devolvendo o registro removido, 200. Vínculos/histórico podem causar 409.

| Recurso | Chave | Inclusão/edição | Exclusão |
| --- | --- | --- | --- |
| `abrigos` | CNPJ string | inclusão com coordenador; edição com capacidade >= ocupação | somente sem referências |
| `animais` | ID inteiro | animal e prontuário juntos; adoção só via decisão | sem pedidos/histórico clínico, não adotado; remove foto e prontuário vazio |
| `adotantes` | CPF string | dados pessoais; e-mail único entre CPFs | somente sem pedidos |
| `pedidos-adocao` | ID inteiro | inclusão por solicitação; edição genérica proibida | proibida; preservar histórico |
| `doadores` | documento string | CPF/CNPJ de 11/14 dígitos | somente sem doações |
| `doacoes` | ID inteiro | dados da doação e doador opcional | permitida |
| `voluntarios` | CPF string | dados pessoais | somente sem ATUA/PARTICIPA |
| `veterinarios` | CPF string | dados pessoais e CRMV único | somente sem vínculos/atendimentos |
| `prontuarios` | ID inteiro | inclusão somente junto com animal; edição preserva associação e coerência clínica | somente junto ao animal sem histórico |
| `atendimentos` | ID inteiro | veterinário vinculado; datas/peso válidos | permitida, recalculando peso |
| `vacinas` | ID inteiro | nome único, espécie compatível com aplicações existentes | somente sem aplicações |
| `feiras` | ID inteiro | feira e participantes do abrigo | limpa as participações |

Nas entidades simples o corpo usa os campos de `frontend/src/types/db.ts`, sem `id` ao criar. Na edição o ID pode ser omitido: vem da rota; se informado, deve coincidir. CPF/CNPJ/documento não podem mudar. `null` representa campos opcionais vazios. Datas usam `YYYY-MM-DD`, números são JSON number e booleanos são JSON boolean.

## Corpos das operações compostas

Os nomes abaixo representam objetos completos dos respectivos tipos, não nomes de campos SQL a serem escritos pelo cliente.

| Operação | Corpo |
| --- | --- |
| POST `/abrigos` | `{ abrigo: Abrigo, gestor: Voluntario }` |
| PUT `/abrigos/:cnpj` | `Abrigo` |
| POST/PUT `/animais[/:id]` | `{ animal: Animal sem id, prontuario: Prontuario sem id/id_animal }` |
| POST `/pedidos-adocao` | `{ adotante: Adotante, id_animal: number }` |
| POST `/pedidos-adocao/:id/decisao` | `{ decisao: "aprovado" ou "reprovado" }` |
| POST/PUT `/doacoes[/:id]` | `{ doacao: Doacao sem id/documento_doador, doador: Doador ou null }` |
| POST/PUT `/atendimentos[/:id]` | `Atendimento sem id` |
| POST/PUT `/feiras[/:id]` | `{ feira: FeiraAdocao sem id, participantes: string[] de CPFs }` |

Pedidos sempre nascem pendentes; datas do pedido/decisão são definidas pelo servidor no fuso America/Sao_Paulo. Decisões finais são imutáveis. A aprovação adota o animal e reprova os demais pedidos pendentes dele na mesma transação.

Animais adotados podem ter seus dados cadastrais corrigidos, mantendo o status e abrigo; os demais só podem assumir disponivel, reservado ou em_tratamento via edição manual. O estado adotado exige aprovação de pedido.

## Associações

| Rota | Operação/corpo |
| --- | --- |
| GET `/abrigos/:cnpj/equipe/voluntarios` | listar ATUA do abrigo |
| GET `/abrigos/:cnpj/equipe/veterinarios` | listar VINCULO do abrigo |
| PUT `/abrigos/:cnpj/equipe/voluntarios` | `{ pessoa: Voluntario, funcao: string }`; criar/atualizar pessoa e vínculo |
| PUT `/abrigos/:cnpj/equipe/veterinarios` | `{ pessoa: Veterinario }`; criar/atualizar pessoa e garantir vínculo |
| DELETE `/abrigos/:cnpj/equipe/voluntarios/:cpf` | desvincular e remover participações nas feiras desse abrigo |
| DELETE `/abrigos/:cnpj/equipe/veterinarios/:cpf` | desvincular preservando atendimentos |
| GET `/prontuarios/:id/aplicacoes` | listar aplicações do prontuário |
| POST `/prontuarios/:id/aplicacoes` | `{ aplicacao: Aplicacao, novaVacina?: { nome, especie_alvo } }` |
| PUT `/prontuarios/:id/aplicacoes/:vacina/:dose` | `{ aplicacao: Aplicacao }`; corrigir data/lote, preservando chave composta |
| DELETE `/prontuarios/:id/aplicacoes/:vacina/:dose` | remover aplicação pela chave completa |
| GET `/feiras/:id/participantes` | listar PARTICIPA |
| PUT `/feiras/:id/participantes` | `{ participantes: string[] de CPFs }`; substituir lista, inclusive por lista vazia |

Na aplicação, `id_prontuario` pode ser omitido do corpo pois vem da rota. Com `novaVacina`, `id_vacina` deve ser null ou omitido. Sem `novaVacina`, informe um ID existente. Dose é inteiro positivo e a tupla prontuário/vacina/dose deve ser única.

## Foto

- PUT `/animais/:id/foto`: multipart/form-data com um arquivo no campo `foto`, JPEG/PNG até 5 MiB. Cria ou substitui uma única foto.
- GET `/animais/:id/foto`: bytes com Content-Type; 404 se não há foto ou animal; 501 se query pendente.
- DELETE `/animais/:id/foto`: remove foto; idempotente para animal existente.
- Foto aparece no perfil do animal; ilustração da espécie permanece quando não há imagem. Erro de carregamento e SQL pendente são mostrados explicitamente.

## Erros e experiência da interface

| HTTP | Significado |
| --- | --- |
| 400 | JSON, tipos, chaves, datas ou arquivo inválidos; operação não permitida por aquela rota |
| 404 | recurso/registro não encontrado |
| 409 | capacidade, duplicidade, FK, decisão final ou outra regra de negócio |
| 413 | arquivo excede limite do upload |
| 501 | `{ code: "SQL_NOT_IMPLEMENTED", message, queries: string[] }` |
| 503 | banco indisponível, falha de consulta ou retorno incompatível com contrato |

Os formulários esperam a confirmação da API e bloqueiam reenvios. Falhas de gravação mantêm os dados preenchidos e não mostram sucesso. Após gravar, o frontend recarrega `/dados`. Se essa recarga falhar, informa que a operação foi salva e pede apenas recarga, evitando incentivar uma segunda inclusão. Não há fallback para `mockDb` nem armazenamento local das entidades.

`GET /health/database` permanece fora de `/api` e verifica somente a conexão PostgreSQL. Responder 200 nessa rota não comprova implementação das consultas do domínio.
