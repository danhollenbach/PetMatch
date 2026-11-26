# PetMatch — Frontend integrado à API

Interface do Sistema Integrado de Abrigos e Adoção de Animais.
React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui (preset Maia, base Radix, ícones Lucide).

> Conectado ao NestJS por HTTP. Não há persistência simulada. As queries SQL estão
> vazias para implementação manual; até preenchê-las, a interface informa a pendência.

```bash
npm ci
npm run dev      # http://localhost:5173
npm run build    # type-check + build de produção
```

## Telas

| Rota | Tela | Acesso |
| --- | --- | --- |
| `/` | Catálogo de animais com filtros (espécie, raça, sexo, castrado, UF, cidade) + abrigos parceiros | Público |
| `/animais/:id` | Perfil do animal: dados, prontuário, vacinas, pedido de adoção. Para membros do abrigo: histórico de atendimentos e ações clínicas | Público + clínico |
| `/abrigos/:cnpj` | Página pública do abrigo: contato, ocupação, animais, próximas feiras, doação | Público |
| `/painel?aba=…` | Painel do abrigo em abas: **Visão geral**, **Pedidos**, **Equipe**, **Feiras** | Membro do abrigo |

As telas 4, 5 e 6 sugeridas (Hub, Fila de pedidos, Equipe/Feiras) foram unidas em um único painel com abas;
a aba ativa fica na URL (`?aba=pedidos`), então links diretos continuam funcionando.

Na barra superior:
- **Seletor de cor de destaque**: Esmeralda, Âmbar, Violeta, Azul-céu, Rosa. As superfícies escuras também
  ganham um leve tom da cor escolhida.
- **Seletor de sessão**: alterna entre visitante público e membro de qualquer abrigo.
- **Cadastrar abrigo**: cria ABRIGO + VOLUNTARIO responsável (ATUA com função "Coordenação") e entra no modo abrigo.

## Cobertura das tabelas

| Tabela | Onde |
| --- | --- |
| ABRIGO | Cadastrar abrigo (navbar), Editar dados (painel), página pública |
| ANIMAL + PRONTUARIO | Cadastrar/editar animal (painel e perfil), criados juntos (1:1), respeitando a Capacidade |
| ATENDIMENTO + VETERINARIO | Perfil do animal → Novo atendimento / histórico (só veterinários vinculados ao abrigo) |
| APLICACAO + VACINA | Perfil do animal → Registrar vacina (escolhe do catálogo ou cria uma nova vacina) |
| ADOTANTE + PEDIDO_ADOCAO | Perfil do animal → Solicitar adoção; Painel → Pedidos → Aprovar/Reprovar |
| DOACAO + DOADOR | Página pública → Doar; Painel → Doação presencial; lista no painel |
| VOLUNTARIO + ATUA | Painel → Equipe (adicionar, editar função, remover) |
| VETERINARIO + VINCULO | Painel → Equipe (vincular, editar, desvincular) |
| FEIRA_ADOCAO + PARTICIPA | Painel → Feiras (criar, editar, excluir, escalar voluntários) |

## Integração

Inicie PostgreSQL e NestJS conforme o [README da raiz](../README.md). O proxy do
Vite encaminha `/api` para `http://127.0.0.1:3000`; ajuste `vite.config.ts` se
alterar a porta do backend.

A carga inicial usa `GET /api/dados`. As ações de `store/actions.ts` chamam a API
e recarregam os dados após gravar. Formulários esperam a resposta, bloqueiam
envio duplicado e preservam campos em erros. A seleção de abrigo continua sendo
uma **sessão de demonstração, sem autenticação**.

As regras definitivas ficam no backend: capacidade, disponibilidade, decisões
imutáveis, unicidade, vínculos e coerência clínica. Os seletores locais apenas
montam a apresentação a partir do snapshot recebido.

O perfil do animal permite enviar/substituir/remover foto JPEG/PNG de até 5 MiB.
Sem foto, usa a ilustração de espécie; falhas e queries pendentes têm mensagem.
A API de foto aguarda alteração manual do esquema e implementação das queries.

Consulte [API.md](../docs/API.md), [SQL_BACKEND.md](../docs/SQL_BACKEND.md) e
[TODO.md](../TODO.md) para contratos e pendências. Build e lint:

```bash
npm run build
npm run lint
```

## Estrutura

```
src/
  types/db.ts          tipos espelhando as tabelas SQL
  data/mock.ts         referência histórica do protótipo; não importada em runtime
  store/db.tsx         snapshot remoto, carregamento e falhas
  store/actions.ts     mutações HTTP e recarga após sucesso
  lib/api.ts           transporte e erros da API
  store/session.tsx    sessão (visitante / abrigo) e cor de destaque
  lib/queries.ts       seletores de apresentação sobre dados recebidos da API
  lib/format.ts        máscaras, datas, moeda e rótulos pt-BR
  components/          layout, cards, diálogos (modais) e componentes compartilhados
  pages/               Catálogo, Animal, Abrigo e Painel (+ abas em pages/panel)
```

### Convenções para a integração com o backend

- As chaves dos tipos usam `snake_case` minúsculo, que é o formato que o PostgreSQL devolve para
  identificadores não-citados. Assim, as linhas das consultas SQL puras do NestJS encaixam direto nos tipos.
- `DATE` é uma string `YYYY-MM-DD`. Documentos e telefones guardam **só dígitos** (as máscaras são só visuais).
- `NUMERIC` é tratado como `number`. O driver `pg` devolve string, então converta no backend.
- As mutações usam o contrato da API. Não adicionar fallback para mock ao tratar erro HTTP ou SQL pendente.

### Valores de domínio usados (colunas VARCHAR)

| Coluna | Valores |
| --- | --- |
| `animal.status` | `disponivel`, `em_tratamento`, `reservado`, `adotado` |
| `animal.especie` | `cachorro`, `gato` |
| `vacina.especie_alvo` | `cachorro`, `gato`, `ambos` |
| `pedido_adocao.status` | `pendente`, `aprovado`, `reprovado` |
| `doacao.tipo` | `dinheiro`, `insumo` |
| `atendimento.tipo` | `consulta`, `retorno`, `exame`, `cirurgia`, `emergencia` |
| `animal.sexo` | `M`, `F` |
