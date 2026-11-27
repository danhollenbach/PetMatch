CREATE TABLE DOADOR (
    Documento   VARCHAR(14)  PRIMARY KEY,
    Nome        VARCHAR(120) NOT NULL,
    Email       VARCHAR(120),
    Telefone    VARCHAR(20),
    -- CPF (11 dígitos) ou CNPJ (14 dígitos), apenas números
    CONSTRAINT ck_doador_documento CHECK (Documento ~ '^([0-9]{11}|[0-9]{14})$')
);

CREATE TABLE ABRIGO (
    CNPJ        CHAR(14)     PRIMARY KEY,
    Nome        VARCHAR(120) NOT NULL,
    Telefone    VARCHAR(20)  NOT NULL,
    Capacidade  INT          NOT NULL,
    Logradouro  VARCHAR(150) NOT NULL,
    CEP         CHAR(8),
    UF          CHAR(2)      NOT NULL,
    Cidade      VARCHAR(80)  NOT NULL,
    CONSTRAINT ck_abrigo_cnpj       CHECK (CNPJ ~ '^[0-9]{14}$'),
    CONSTRAINT ck_abrigo_capacidade CHECK (Capacidade >= 1),
    CONSTRAINT ck_abrigo_cep        CHECK (CEP ~ '^[0-9]{8}$'),
    CONSTRAINT ck_abrigo_uf         CHECK (UF ~ '^[A-Z]{2}$')
);

CREATE TABLE VOLUNTARIO (
    CPF         CHAR(11)     PRIMARY KEY,
    Email       VARCHAR(120),
    Nome        VARCHAR(120) NOT NULL,
    Telefone    VARCHAR(20),
    CONSTRAINT ck_voluntario_cpf CHECK (CPF ~ '^[0-9]{11}$')
);

CREATE TABLE VETERINARIO (
    CPF         CHAR(11)     PRIMARY KEY,
    Email       VARCHAR(120),
    Nome        VARCHAR(120) NOT NULL,
    Telefone    VARCHAR(20),
    CRMV        VARCHAR(20)  NOT NULL UNIQUE,
    CONSTRAINT ck_veterinario_cpf CHECK (CPF ~ '^[0-9]{11}$')
);

CREATE TABLE ADOTANTE (
    CPF         CHAR(11)     PRIMARY KEY,
    Email       VARCHAR(120) NOT NULL UNIQUE,
    Nome        VARCHAR(120) NOT NULL,
    Telefone    VARCHAR(20)  NOT NULL,
    CONSTRAINT ck_adotante_cpf CHECK (CPF ~ '^[0-9]{11}$')
);

CREATE TABLE VACINA (
    Id           SERIAL      PRIMARY KEY,
    Nome         VARCHAR(80) NOT NULL UNIQUE,
    Especie_alvo VARCHAR(10) NOT NULL,
    CONSTRAINT ck_vacina_especie_alvo CHECK (Especie_alvo IN ('cachorro', 'gato', 'ambos'))
);

CREATE TABLE DOACAO (
    Id               SERIAL        PRIMARY KEY,
    CNPJ_abrigo      CHAR(14)      NOT NULL REFERENCES ABRIGO (CNPJ),
    Documento_doador VARCHAR(14)   REFERENCES DOADOR (Documento),
    Valor            NUMERIC(10,2),
    Descricao        VARCHAR(200),
    Data             DATE          NOT NULL,
    Tipo             VARCHAR(10)   NOT NULL,
    CONSTRAINT ck_doacao_tipo CHECK (Tipo IN ('dinheiro', 'insumo')),
    -- Dinheiro exige valor positivo; insumo não tem valor e exige descrição
    CONSTRAINT ck_doacao_coerencia CHECK (
        (Tipo = 'dinheiro' AND Valor IS NOT NULL AND Valor > 0)
        OR (Tipo = 'insumo' AND Valor IS NULL AND Descricao IS NOT NULL AND btrim(Descricao) <> '')
    )
);

CREATE TABLE ANIMAL (
    Id              SERIAL      PRIMARY KEY,
    CNPJ_abrigo     CHAR(14)    NOT NULL REFERENCES ABRIGO (CNPJ),
    Sexo            CHAR(1)     NOT NULL,
    Nome            VARCHAR(60) NOT NULL,
    Data_nascimento DATE,
    Raca            VARCHAR(60) NOT NULL,
    Status          VARCHAR(15) NOT NULL,
    Castrado        BOOLEAN     NOT NULL,
    Especie         VARCHAR(10) NOT NULL,
    CONSTRAINT ck_animal_sexo    CHECK (Sexo IN ('M', 'F')),
    CONSTRAINT ck_animal_status  CHECK (Status IN ('disponivel', 'em_tratamento', 'reservado', 'adotado')),
    CONSTRAINT ck_animal_especie CHECK (Especie IN ('cachorro', 'gato'))
);

CREATE TABLE PRONTUARIO (
    Id            SERIAL       PRIMARY KEY,
    Id_animal     INT          NOT NULL UNIQUE REFERENCES ANIMAL (Id),
    Data_abertura DATE         NOT NULL,
    Alergias      VARCHAR(200),
    Observacoes   TEXT,
    Peso          NUMERIC(5,2),
    CONSTRAINT ck_prontuario_peso CHECK (Peso > 0)
);

CREATE TABLE ATENDIMENTO (
    Id              SERIAL       PRIMARY KEY,
    CPF_veterinario CHAR(11)     NOT NULL REFERENCES VETERINARIO (CPF),
    Id_prontuario   INT          NOT NULL REFERENCES PRONTUARIO (Id),
    Data            DATE         NOT NULL,
    Diagnostico     TEXT         NOT NULL,
    Tratamento      TEXT,
    Tipo            VARCHAR(15)  NOT NULL,
    Peso            NUMERIC(5,2),
    CONSTRAINT ck_atendimento_tipo CHECK (Tipo IN ('consulta', 'retorno', 'exame', 'cirurgia', 'emergencia')),
    CONSTRAINT ck_atendimento_peso CHECK (Peso > 0)
);

CREATE TABLE PEDIDO_ADOCAO (
    Id           SERIAL      PRIMARY KEY,
    Id_animal    INT         NOT NULL REFERENCES ANIMAL (Id),
    CPF_adotante CHAR(11)    NOT NULL REFERENCES ADOTANTE (CPF),
    Status       VARCHAR(10) NOT NULL,
    Data_pedido  DATE        NOT NULL,
    Data_decisao DATE,
    CONSTRAINT ck_pedido_status CHECK (Status IN ('pendente', 'aprovado', 'reprovado')),
    -- Pendente não tem decisão; aprovado/reprovado exigem data de decisão
    CONSTRAINT ck_pedido_decisao CHECK (
        (Status = 'pendente' AND Data_decisao IS NULL)
        OR (Status IN ('aprovado', 'reprovado') AND Data_decisao IS NOT NULL)
    ),
    CONSTRAINT ck_pedido_datas CHECK (Data_decisao >= Data_pedido)
);

CREATE TABLE FEIRA_ADOCAO (
    Id          SERIAL       PRIMARY KEY,
    CNPJ_abrigo CHAR(14)     NOT NULL REFERENCES ABRIGO (CNPJ),
    Nome        VARCHAR(120) NOT NULL,
    Logradouro  VARCHAR(150) NOT NULL,
    Data        DATE         NOT NULL
);

CREATE TABLE ATUA (
    CNPJ_abrigo    CHAR(14)    NOT NULL REFERENCES ABRIGO (CNPJ),
    CPF_voluntario CHAR(11)    NOT NULL REFERENCES VOLUNTARIO (CPF),
    Funcao         VARCHAR(30) NOT NULL,
    PRIMARY KEY (CNPJ_abrigo, CPF_voluntario)
);

CREATE TABLE VINCULO (
    CPF_veterinario CHAR(11) NOT NULL REFERENCES VETERINARIO (CPF),
    CNPJ_abrigo     CHAR(14) NOT NULL REFERENCES ABRIGO (CNPJ),
    PRIMARY KEY (CPF_veterinario, CNPJ_abrigo)
);

CREATE TABLE APLICACAO (
    Id_prontuario  INT         NOT NULL REFERENCES PRONTUARIO (Id),
    Id_vacina      INT         NOT NULL REFERENCES VACINA (Id),
    Dose           INT         NOT NULL,
    Data_aplicacao DATE        NOT NULL,
    Lote           VARCHAR(30) NOT NULL,
    PRIMARY KEY (Id_prontuario, Id_vacina, Dose),
    CONSTRAINT ck_aplicacao_dose CHECK (Dose >= 1)
);

CREATE TABLE PARTICIPA (
    CPF_voluntario  CHAR(11) NOT NULL REFERENCES VOLUNTARIO (CPF),
    Id_feira_adocao INT      NOT NULL REFERENCES FEIRA_ADOCAO (Id),
    PRIMARY KEY (CPF_voluntario, Id_feira_adocao)
);
