CREATE TABLE DOADOR (
    Documento   VARCHAR(14)  PRIMARY KEY,
    Nome        VARCHAR(120) NOT NULL,
    Email       VARCHAR(120),
    Telefone    VARCHAR(20)
);

CREATE TABLE ABRIGO (
    CNPJ        CHAR(14)     PRIMARY KEY,
    Nome        VARCHAR(120) NOT NULL,
    Telefone    VARCHAR(20)  NOT NULL,
    Capacidade  INT          NOT NULL,
    Logradouro  VARCHAR(150) NOT NULL,
    CEP         CHAR(8),
    UF          CHAR(2)      NOT NULL,
    Cidade      VARCHAR(80)  NOT NULL
);

CREATE TABLE VOLUNTARIO (
    CPF         CHAR(11)     PRIMARY KEY,
    Email       VARCHAR(120),
    Nome        VARCHAR(120) NOT NULL,
    Telefone    VARCHAR(20)
);

CREATE TABLE VETERINARIO (
    CPF         CHAR(11)     PRIMARY KEY,
    Email       VARCHAR(120),
    Nome        VARCHAR(120) NOT NULL,
    Telefone    VARCHAR(20),
    CRMV        VARCHAR(20)  NOT NULL UNIQUE
);

CREATE TABLE ADOTANTE (
    CPF         CHAR(11)     PRIMARY KEY,
    Email       VARCHAR(120) NOT NULL UNIQUE,
    Nome        VARCHAR(120) NOT NULL,
    Telefone    VARCHAR(20)  NOT NULL
);

CREATE TABLE VACINA (
    Id           SERIAL      PRIMARY KEY,
    Nome         VARCHAR(80) NOT NULL UNIQUE,
    Especie_alvo VARCHAR(10) NOT NULL
);

CREATE TABLE DOACAO (
    Id               SERIAL        PRIMARY KEY,
    CNPJ_abrigo      CHAR(14)      NOT NULL REFERENCES ABRIGO (CNPJ),
    Documento_doador VARCHAR(14)   REFERENCES DOADOR (Documento),
    Valor            NUMERIC(10,2),
    Descricao        VARCHAR(200),
    Data             DATE          NOT NULL,
    Tipo             VARCHAR(10)   NOT NULL
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
    Especie         VARCHAR(10) NOT NULL
);

CREATE TABLE PRONTUARIO (
    Id            SERIAL       PRIMARY KEY,
    Id_animal     INT          NOT NULL UNIQUE REFERENCES ANIMAL (Id),
    Data_abertura DATE         NOT NULL,
    Alergias      VARCHAR(200),
    Observacoes   TEXT,
    Peso          NUMERIC(5,2)
);

CREATE TABLE ATENDIMENTO (
    Id              SERIAL       PRIMARY KEY,
    CPF_veterinario CHAR(11)     NOT NULL REFERENCES VETERINARIO (CPF),
    Id_prontuario   INT          NOT NULL REFERENCES PRONTUARIO (Id),
    Data            DATE         NOT NULL,
    Diagnostico     TEXT         NOT NULL,
    Tratamento      TEXT,
    Tipo            VARCHAR(15)  NOT NULL,
    Peso            NUMERIC(5,2)
);

CREATE TABLE PEDIDO_ADOCAO (
    Id           SERIAL      PRIMARY KEY,
    Id_animal    INT         NOT NULL REFERENCES ANIMAL (Id),
    CPF_adotante CHAR(11)    NOT NULL REFERENCES ADOTANTE (CPF),
    Status       VARCHAR(10) NOT NULL,
    Data_pedido  DATE        NOT NULL,
    Data_decisao DATE
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
    PRIMARY KEY (Id_prontuario, Id_vacina, Dose)
);

CREATE TABLE PARTICIPA (
    CPF_voluntario  CHAR(11) NOT NULL REFERENCES VOLUNTARIO (CPF),
    Id_feira_adocao INT      NOT NULL REFERENCES FEIRA_ADOCAO (Id),
    PRIMARY KEY (CPF_voluntario, Id_feira_adocao)
);
