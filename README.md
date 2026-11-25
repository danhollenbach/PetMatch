# Diretrizes do Projeto de Banco de Dados

## Datas Importantes 📝
- ~~**15/10:** Apresentar o tema do projeto e os membros dos grupos.~~
- ~~**17/11:** Entrega da primeira parte do projeto.~~
- **01/12 e 03/12:** Entrega e Apresentação final do projeto.

## Regras Gerais
- [ ] O modelo deve ter no mínimo **10 entidades**.
- [ ] Cada tabela deve conter uma quantidade de dados suficiente para demonstrar o funcionamento dos relacionamentos, das restrições de integridade, das consultas e das funcionalidades implementadas. As principais tabelas do sistema deverão possuir **pelo menos 10 registros**, salvo quando a natureza dos dados justificar quantidade inferior.
- [ ] O **CRUD** deve estar funcionando plenamente.
### obs.
- É permitido utilizar qualquer SGBD relacional.
- É permitido utilizar qualquer linguagem de programação para o CRUD, porém é obrigatório o desenvolvimento de uma **interface gráfica** para o usuário leigo ter acesso ao sistema.

## Entregas do Projeto

### Entrega da Primeira Parte
- [ ] Introdução.
- [ ] Modelo de Entidade Relacionamento (usando alguma ferramenta de modelagem).
- [ ] Modelo Relacional (usando alguma ferramenta de modelagem).
- [ ] O script SQL que gerou o banco de dados.
- [ ] A indicação do uso de IA.

### Entrega Final
- [ ] Introdução.
- [ ] Modelo de Entidade Relacionamento (usando alguma ferramenta de modelagem).
- [ ] Modelo Relacional (usando alguma ferramenta de modelagem).
- [ ] O script SQL que gerou o banco de dados.
  - [ ] *Requisito:* Na implementação de pelo menos uma tabela, usar um gerador de chave primária automático do SGBD selecionado.
- [ ] A construção da camada de persistência. Enviar o link do GitHub com os códigos-fontes e um diagrama apresentando como a interface gráfica do programa acessa a camada de persistência.
- [ ] Um programa com as funções de CRUD (Create, Read, Update, Delete) para o sistema.
  - [ ] *Requisito:* Pelo menos uma funcionalidade do sistema deverá envolver operações sobre duas ou mais tabelas relacionadas, demonstrando o uso adequado de chaves estrangeiras e a manutenção da integridade referencial.
- [ ] Utilização de pelo menos uma **View**.
- [ ] Utilização de pelo menos uma **Procedure**.
- [ ] Utilização de pelo menos um **Trigger**.
- [ ] Inserção de um dado binário no banco (pode ser foto, arquivo PDF ou outro tipo de arquivo).
- [ ] A indicação do uso de IA.

---

## Formato de Submissão (Aprender3)

### Para a Primeira Entrega (Apenas UM arquivo PDF)
- Introdução.
- Diagrama de Entidade Relacionamento.
- Modelo Relacional.
- A indicação do uso de IA.

### Para a Entrega Final (Apenas UM arquivo PDF)
- No início do PDF, informar o endereço do repositório no GitHub.
- Introdução.
- Diagrama de Entidade Relacionamento.
- Modelo Relacional.
- O diagrama da camada de mapeamento para uma tabela do banco de dados.
- A indicação do uso de IA.

---

## Repositório (GitHub)
Os seguintes itens devem ser versionados e disponibilizados no repositório do projeto:
- O script SQL que gerou o banco de dados.
- Todos os códigos-fontes do projeto (interface, CRUD, conexões, etc).

---
# Como rodar o projeto? 🚀

## Banco local com PostgreSQL e Docker Compose

O SGBD escolhido é **PostgreSQL**, com a imagem oficial `postgres:17-bookworm`.
O Compose inicia apenas o banco; frontend e backend continuam sendo executados
localmente. A conexão do NestJS ao banco ainda precisa ser implementada.

### 1. Preparar o Docker e as variáveis

Mantenha o OrbStack ou o Docker Desktop aberto. No terminal, entre na raiz do
repositório (a pasta que contém `compose.yaml`) e confira:

```bash
docker compose version
docker info
```

Na primeira configuração, copie o exemplo sem sobrescrever um `.env` existente:

```bash
cp -n .env.example .env
```

Edite o `.env` e escolha `POSTGRES_PASSWORD` antes de iniciar o banco pela primeira
vez. O arquivo é ignorado pelo Git. Cada integrante deve criar seu próprio `.env`.
O Compose lê esse arquivo da raiz; ele não configura automaticamente o backend.

### 2. Iniciar o banco

Execute na raiz do projeto:

```bash
docker compose config --quiet
docker compose up -d --wait
docker compose ps
```

O primeiro comando valida a configuração sem imprimir a senha. O segundo baixa a
imagem se necessário, cria o volume de dados e aguarda o banco ficar saudável.
O serviço `postgres` deve aparecer como `healthy`.

Na primeira inicialização de um volume vazio, o arquivo
`backend/database/schema.sql` é executado automaticamente, criando as 16 tabelas.
O arquivo é montado somente para leitura; os dados ficam no volume
`petmatch_postgres_data`, separado do código.

### 3. Conferir as tabelas e executar SQL

Abra o terminal SQL dentro do container (não precisa instalar `psql` no computador):

```bash
docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Dentro do `psql`:

```sql
\dt
\d animal
SELECT COUNT(*) FROM animal;
\q
```

`\dt` lista as 16 tabelas, `\d animal` mostra sua estrutura e `\q` sai do terminal.
O esquema inicial não inclui dados de exemplo, portanto a contagem começa em zero.
Os nomes SQL sem aspas são apresentados em minúsculas pelo PostgreSQL.

Para conectar uma ferramenta gráfica ou, depois, o backend executado no computador:

| Campo | Valor |
| --- | --- |
| Host | `127.0.0.1` |
| Porta | `5433` ou o valor de `POSTGRES_PORT` no `.env` |
| Banco | `petmatch` ou o valor de `POSTGRES_DB` |
| Usuário | `petmatch` ou o valor de `POSTGRES_USER` |
| Senha | Valor de `POSTGRES_PASSWORD` no `.env` |
| SSL | Desabilitado para esta instância local |

O acesso publicado fica restrito ao próprio computador. Se futuramente o backend
também entrar no mesmo Compose, o host dentro dele será `postgres` e a porta será
`5432`, independentemente da porta publicada no computador.

### 4. Uso diário e persistência

```bash
# Parar o banco preservando os dados
docker compose stop

# Iniciar novamente e aguardar ficar pronto
docker compose up -d --wait

# Consultar os logs recentes
docker compose logs --tail=100 postgres

# Remover o container e a rede, preservando o volume de dados
docker compose down
```

**Não use `docker compose down -v` para parar o ambiente:** a opção `-v` remove o
volume e apaga os dados locais. Ela só deve ser usada quando você deliberadamente
quiser descartar o banco e reconstruí-lo do zero.

### 5. Alterações e problemas comuns

- **Docker indisponível:** abra o OrbStack ou Docker Desktop e aguarde `docker info`
  funcionar.
- **Porta ocupada ou erro `role "petmatch" does not exist`:** confira se a conexão
  está chegando ao banco Docker. Neste computador há um PostgreSQL nativo na porta
  `5432`, por isso o PetMatch publica `5433`. Se necessário, escolha outra porta
  livre em `POSTGRES_PORT`, execute `docker compose up -d --wait` e reinicie o NestJS.
  Use a mesma porta na ferramenta gráfica. Dentro do container, o banco continua
  usando `5432`.
- **Alterou o `schema.sql`:** reiniciar o container não reaplica o arquivo. Use
  scripts incrementais de alteração no banco existente; a inicialização automática
  só ocorre com o volume vazio. Não execute novamente todo o script de criação
  sobre as tabelas existentes.
- **Alterou usuário, banco ou senha no `.env`:** essas variáveis inicializam um
  banco novo; não renomeiam banco/usuário nem trocam a senha do banco já criado.
  Altere o banco existente por SQL ou mantenha os valores originais do `.env`.
- **Falha na criação inicial:** consulte os logs e corrija o SQL. Um volume
  parcialmente inicializado não volta a executar automaticamente o script; avalie
  uma correção SQL ou a recriação apenas se não houver dados a preservar.

Referências: [imagem oficial do PostgreSQL](https://hub.docker.com/_/postgres) e
[Docker Compose](https://docs.docker.com/compose/gettingstarted/).

## Para rodar o frontend
```bash
cd frontend/
$ npm run dev
```

## Para rodar o backend
```bash
cd backend/
# development
$ npm run start

# watch mode
$ npm run start:dev
```
