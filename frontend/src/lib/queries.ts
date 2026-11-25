import type { Database } from "@/types/db"

/**
 * Leituras com "JOINs" sobre o banco em memória. Cada função corresponde a
 * uma consulta SQL que o backend executará futuramente.
 */

export const abrigoPorCnpj = (db: Database, cnpj: string) => db.abrigo.find((a) => a.cnpj === cnpj)

/** Animais que ocupam vaga: todos do abrigo, exceto os adotados. */
export const ocupacao = (db: Database, cnpj: string) =>
  db.animal.filter((a) => a.cnpj_abrigo === cnpj && a.status !== "adotado").length

export const prontuarioDoAnimal = (db: Database, idAnimal: number) =>
  db.prontuario.find((p) => p.id_animal === idAnimal)

/** APLICACAO ⋈ VACINA */
export const vacinasDoProntuario = (db: Database, idProntuario: number) =>
  db.aplicacao
    .filter((ap) => ap.id_prontuario === idProntuario)
    .map((ap) => ({ ...ap, vacina: db.vacina.find((v) => v.id === ap.id_vacina)! }))
    .sort((a, b) => b.data_aplicacao.localeCompare(a.data_aplicacao))

/** ATENDIMENTO ⋈ VETERINARIO */
export const atendimentosDoProntuario = (db: Database, idProntuario: number) =>
  db.atendimento
    .filter((at) => at.id_prontuario === idProntuario)
    .map((at) => ({ ...at, veterinario: db.veterinario.find((v) => v.cpf === at.cpf_veterinario)! }))
    .sort((a, b) => b.data.localeCompare(a.data))

/** PEDIDO_ADOCAO ⋈ ANIMAL ⋈ ADOTANTE, filtrado pelo abrigo do animal */
export const pedidosDoAbrigo = (db: Database, cnpj: string) =>
  db.pedido_adocao
    .map((p) => ({
      ...p,
      animal: db.animal.find((a) => a.id === p.id_animal)!,
      adotante: db.adotante.find((a) => a.cpf === p.cpf_adotante)!,
    }))
    .filter((p) => p.animal.cnpj_abrigo === cnpj)
    .sort((a, b) => b.data_pedido.localeCompare(a.data_pedido) || b.id - a.id)

export type PedidoCompleto = ReturnType<typeof pedidosDoAbrigo>[number]

/** VOLUNTARIO ⋈ ATUA */
export const voluntariosDoAbrigo = (db: Database, cnpj: string) =>
  db.atua
    .filter((a) => a.cnpj_abrigo === cnpj)
    .map((a) => ({ ...db.voluntario.find((v) => v.cpf === a.cpf_voluntario)!, funcao: a.funcao }))
    .sort((a, b) => a.nome.localeCompare(b.nome))

/** VETERINARIO ⋈ VINCULO */
export const veterinariosDoAbrigo = (db: Database, cnpj: string) =>
  db.vinculo
    .filter((v) => v.cnpj_abrigo === cnpj)
    .map((v) => db.veterinario.find((vet) => vet.cpf === v.cpf_veterinario)!)
    .sort((a, b) => a.nome.localeCompare(b.nome))

/** FEIRA_ADOCAO + participantes (PARTICIPA ⋈ VOLUNTARIO) */
export const feirasDoAbrigo = (db: Database, cnpj: string) =>
  db.feira_adocao
    .filter((f) => f.cnpj_abrigo === cnpj)
    .map((f) => ({
      ...f,
      participantes: db.participa
        .filter((p) => p.id_feira_adocao === f.id)
        .map((p) => db.voluntario.find((v) => v.cpf === p.cpf_voluntario)!),
    }))
    .sort((a, b) => a.data.localeCompare(b.data))

/** DOACAO ⟕ DOADOR */
export const doacoesDoAbrigo = (db: Database, cnpj: string) =>
  db.doacao
    .filter((d) => d.cnpj_abrigo === cnpj)
    .map((d) => ({ ...d, doador: db.doador.find((x) => x.documento === d.documento_doador) ?? null }))
    .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id)
