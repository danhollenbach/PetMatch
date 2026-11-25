# PetMatch — Frontend (protótipo)

Interface do Sistema Integrado de Abrigos e Adoção de Animais.
React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui (preset Maia, base Radix, ícones Lucide).

> Apenas frontend. Os dados ficam **em memória** (arrays TypeScript + React Context) e são
> reiniciados ao recarregar a página.

```bash
npm install
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

## Regras implementadas no mock

As ações em `src/store/db.tsx` validam as mesmas restrições do schema e lançam `DbError` com uma mensagem amigável:

- PK/UNIQUE: CNPJ do abrigo, e-mail do adotante, CRMV, nome da vacina, `(prontuário, vacina, dose)`.
- Capacidade: ocupação = animais do abrigo que não estão `adotado`. Não é possível cadastrar (ou "desadotar") acima do limite.
- Aprovar um pedido define `status = 'aprovado'` e `data_decisao` no pedido, marca o animal como `adotado`
  e reprova automaticamente os demais pedidos pendentes do mesmo animal.
- Um atendimento com peso atualiza o peso atual do prontuário.
- Remover um voluntário da equipe também remove as participações dele nas feiras daquele abrigo.
- CPF/CNPJ/CEP/telefone já existentes (adotante, doador, voluntário, veterinário) são detectados e os dados preenchidos.

## Estrutura

```
src/
  types/db.ts          tipos espelhando as tabelas SQL
  data/mock.ts         dados fictícios (4 abrigos, 22 animais, …)
  store/db.tsx         "banco" em memória + ações de escrita (CRUD)
  store/session.tsx    sessão (visitante / abrigo) e cor de destaque
  lib/queries.ts       leituras com "JOINs" (equivalentes às futuras consultas SQL)
  lib/format.ts        máscaras, datas, moeda e rótulos pt-BR
  components/          layout, cards, diálogos (modais) e componentes compartilhados
  pages/               Catálogo, Animal, Abrigo e Painel (+ abas em pages/panel)
```

### Convenções para a integração com o backend

- As chaves dos tipos usam `snake_case` minúsculo, que é o formato que o PostgreSQL devolve para
  identificadores não-citados. Assim, as linhas das consultas SQL puras do NestJS encaixam direto nos tipos.
- `DATE` é uma string `YYYY-MM-DD`. Documentos e telefones guardam **só dígitos** (as máscaras são só visuais).
- `NUMERIC` é tratado como `number`. O driver `pg` devolve string, então converta no backend.
- Para integrar, troque o corpo de cada ação em `store/db.tsx` e de cada função em `lib/queries.ts` por chamadas à API.
  As telas não precisam mudar.

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
