# Diretrizes do Projeto de Banco de Dados

## Datas Importantes
- **15/10 (quinta-feira):** Dois minutos para apresentar o tema do projeto e os membros dos grupos.
- **17/11:** Entrega da primeira parte do projeto.
- **01/12 e 03/12:** Entrega e Apresentação final do projeto.

## Regras Gerais
- O modelo deve ter no mínimo **10 entidades**.
- Cada tabela deve conter uma quantidade de dados suficiente para demonstrar o funcionamento dos relacionamentos, das restrições de integridade, das consultas e das funcionalidades implementadas. As principais tabelas do sistema deverão possuir **pelo menos 10 registros**, salvo quando a natureza dos dados justificar quantidade inferior.
- O **CRUD** deve estar funcionando plenamente.
- É permitido utilizar qualquer SGBD relacional.
- É permitido utilizar qualquer linguagem de programação para o CRUD, porém é obrigatório o desenvolvimento de uma **interface gráfica** para o usuário leigo ter acesso ao sistema.

## Entregas do Projeto

### Entrega da Primeira Parte
- Introdução.
- Modelo de Entidade Relacionamento (usando alguma ferramenta de modelagem).
- Modelo Relacional (usando alguma ferramenta de modelagem).
- O script SQL que gerou o banco de dados.
- A indicação do uso de IA.

### Entrega Final
- Introdução.
- Modelo de Entidade Relacionamento (usando alguma ferramenta de modelagem).
- Modelo Relacional (usando alguma ferramenta de modelagem).
- O script SQL que gerou o banco de dados.
  - *Requisito:* Na implementação de pelo menos uma tabela, usar um gerador de chave primária automático do SGBD selecionado.
- A construção da camada de persistência. Enviar o link do GitHub com os códigos-fontes e um diagrama apresentando como a interface gráfica do programa acessa a camada de persistência.
- Um programa com as funções de CRUD (Create, Read, Update, Delete) para o sistema.
  - *Requisito:* Pelo menos uma funcionalidade do sistema deverá envolver operações sobre duas ou mais tabelas relacionadas, demonstrando o uso adequado de chaves estrangeiras e a manutenção da integridade referencial.
- Utilização de pelo menos uma **View**.
- Utilização de pelo menos uma **Procedure**.
- Utilização de pelo menos um **Trigger**.
- Inserção de um dado binário no banco (pode ser foto, arquivo PDF ou outro tipo de arquivo).
- A indicação do uso de IA.

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