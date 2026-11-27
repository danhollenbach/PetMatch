import { json, request } from "../lib/api"
import type { Abrigo, Adotante, Animal, Aplicacao, Atendimento, Doacao, Doador, EspecieAlvo, FeiraAdocao, Prontuario, Veterinario, Voluntario } from "@/types/db"

type OptionalId<T> = Omit<T, "id"> & { id?: number }
export function createApiActions(reload: () => Promise<void>) {
  async function mutate<T>(path: string, method: string, body?: unknown): Promise<T> {
    const result = await request<T>(path, json(method, body))
    await reload()
    return result
  }
  return {
    registrarAbrigo: (abrigo: Abrigo, gestor: Voluntario) => mutate("/abrigos", "POST", { abrigo, gestor }),
    atualizarAbrigo: (abrigo: Abrigo) => mutate(`/abrigos/${abrigo.cnpj}`, "PUT", abrigo),
    async salvarAnimal(value: OptionalId<Animal>, prontuario: Omit<Prontuario, "id" | "id_animal">) {
      const { id, ...animal } = value
      const result = await mutate<Animal>(id === undefined ? "/animais" : `/animais/${id}`, id === undefined ? "POST" : "PUT", { animal, prontuario })
      return result.id
    },
    registrarAtendimento: (at: Omit<Atendimento, "id">) => mutate("/atendimentos", "POST", at),
    registrarAplicacao: (aplicacao: Omit<Aplicacao, "id_vacina"> & { id_vacina: number | null }, novaVacina?: { nome: string; especie_alvo: EspecieAlvo }) =>
      mutate(`/prontuarios/${aplicacao.id_prontuario}/aplicacoes`, "POST", { aplicacao, novaVacina }),
    solicitarAdocao: (adotante: Adotante, id_animal: number) => mutate("/pedidos-adocao", "POST", { adotante, id_animal }),
    decidirPedido: (id: number, decisao: "aprovado" | "reprovado") => mutate(`/pedidos-adocao/${id}/decisao`, "POST", { decisao }),
    registrarDoacao: (doacao: Omit<Doacao, "id" | "documento_doador">, doador: Doador | null) => mutate("/doacoes", "POST", { doacao, doador }),
    salvarVoluntario: (cnpj: string, pessoa: Voluntario, funcao: string) => mutate(`/abrigos/${cnpj}/equipe/voluntarios`, "PUT", { pessoa, funcao }),
    removerVoluntario: (cnpj: string, cpf: string) => mutate(`/abrigos/${cnpj}/equipe/voluntarios/${cpf}`, "DELETE"),
    salvarVeterinario: (cnpj: string, pessoa: Veterinario) => mutate(`/abrigos/${cnpj}/equipe/veterinarios`, "PUT", { pessoa }),
    removerVinculo: (cnpj: string, cpf: string) => mutate(`/abrigos/${cnpj}/equipe/veterinarios/${cpf}`, "DELETE"),
    salvarFeira(value: OptionalId<FeiraAdocao>, participantes: string[]) {
      const { id, ...feira } = value
      return mutate(id === undefined ? "/feiras" : `/feiras/${id}`, id === undefined ? "POST" : "PUT", { feira, participantes })
    },
    removerFeira: (id: number) => mutate(`/feiras/${id}`, "DELETE"),
    removerAnimal: (id: number) => mutate(`/animais/${id}`, "DELETE"),
    removerAtendimento: (id: number) => mutate(`/atendimentos/${id}`, "DELETE"),
    removerAplicacao: (ap: Aplicacao) => mutate(`/prontuarios/${ap.id_prontuario}/aplicacoes/${ap.id_vacina}/${ap.dose}`, "DELETE"),
  }
}
