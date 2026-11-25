/**
 * Tipos espelhando o schema SQL (fonte da verdade).
 *
 * As chaves usam snake_case minúsculo porque o PostgreSQL converte
 * identificadores não-citados para minúsculas — é exatamente o formato que
 * o `pg` devolverá nas linhas das consultas SQL puras do backend NestJS.
 *
 * Convenções:
 *  - DATE  -> string ISO "YYYY-MM-DD"
 *  - NUMERIC -> number (o driver `pg` devolve string; converter no backend)
 *  - CPF/CNPJ/CEP/telefone -> apenas dígitos
 */

export type Especie = "cachorro" | "gato"
export type EspecieAlvo = Especie | "ambos"
export type Sexo = "M" | "F"
export type StatusAnimal = "disponivel" | "em_tratamento" | "reservado" | "adotado"
export type StatusPedido = "pendente" | "aprovado" | "reprovado"
export type TipoDoacao = "dinheiro" | "insumo"
export type TipoAtendimento = "consulta" | "retorno" | "exame" | "cirurgia" | "emergencia"

export interface Doador {
  documento: string // VARCHAR(14): CPF (11) ou CNPJ (14)
  nome: string
  email: string | null
  telefone: string | null
}

export interface Abrigo {
  cnpj: string // CHAR(14)
  nome: string
  telefone: string
  capacidade: number
  logradouro: string
  cep: string | null
  uf: string // CHAR(2)
  cidade: string
}

export interface Voluntario {
  cpf: string // CHAR(11)
  email: string | null
  nome: string
  telefone: string | null
}

export interface Veterinario {
  cpf: string
  email: string | null
  nome: string
  telefone: string | null
  crmv: string // UNIQUE
}

export interface Adotante {
  cpf: string
  email: string // UNIQUE
  nome: string
  telefone: string
}

export interface Vacina {
  id: number
  nome: string // UNIQUE
  especie_alvo: EspecieAlvo
}

export interface Doacao {
  id: number
  cnpj_abrigo: string
  documento_doador: string | null
  valor: number | null
  descricao: string | null
  data: string
  tipo: TipoDoacao
}

export interface Animal {
  id: number
  cnpj_abrigo: string
  sexo: Sexo
  nome: string
  data_nascimento: string | null
  raca: string
  status: StatusAnimal
  castrado: boolean
  especie: Especie
}

export interface Prontuario {
  id: number
  id_animal: number // UNIQUE (1:1 com ANIMAL)
  data_abertura: string
  alergias: string | null
  observacoes: string | null
  peso: number | null
}

export interface Atendimento {
  id: number
  cpf_veterinario: string
  id_prontuario: number
  data: string
  diagnostico: string
  tratamento: string | null
  tipo: TipoAtendimento
  peso: number | null
}

export interface PedidoAdocao {
  id: number
  id_animal: number
  cpf_adotante: string
  status: StatusPedido
  data_pedido: string
  data_decisao: string | null
}

export interface FeiraAdocao {
  id: number
  cnpj_abrigo: string
  nome: string
  logradouro: string
  data: string
}

export interface Atua {
  cnpj_abrigo: string
  cpf_voluntario: string
  funcao: string
}

export interface Vinculo {
  cpf_veterinario: string
  cnpj_abrigo: string
}

export interface Aplicacao {
  id_prontuario: number
  id_vacina: number
  dose: number
  data_aplicacao: string
  lote: string
}

export interface Participa {
  cpf_voluntario: string
  id_feira_adocao: number
}

/** O "banco" em memória: uma lista por tabela. */
export interface Database {
  doador: Doador[]
  abrigo: Abrigo[]
  voluntario: Voluntario[]
  veterinario: Veterinario[]
  adotante: Adotante[]
  vacina: Vacina[]
  doacao: Doacao[]
  animal: Animal[]
  prontuario: Prontuario[]
  atendimento: Atendimento[]
  pedido_adocao: PedidoAdocao[]
  feira_adocao: FeiraAdocao[]
  atua: Atua[]
  vinculo: Vinculo[]
  aplicacao: Aplicacao[]
  participa: Participa[]
}
