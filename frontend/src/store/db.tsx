import { createApiActions } from "./actions"
import { request } from "@/lib/api"
import { createContext, useContext, useState, type ReactNode } from "react"
import { mockDb } from "@/data/mock"
import type {
  Database,
  FeiraAdocao,
  Veterinario,
  Voluntario,
} from "@/types/db"

/**
 * "Banco" em memória. Cada ação valida as mesmas restrições do schema SQL
 * (PK, UNIQUE, FK, Capacidade) e lança DbError com a mensagem para o usuário.
 * Quando o backend existir, cada ação vira uma chamada à API.
 */
export class DbError extends Error {}

type WithOptionalId<T> = Omit<T, "id"> & { id?: number }

const nextId = (rows: { id: number }[]) => rows.reduce((max, r) => Math.max(max, r.id), 0) + 1

function upsert<T>(rows: T[], row: T, same: (r: T) => boolean): T[] {
  return rows.some(same) ? rows.map((r) => (same(r) ? row : r)) : [...rows, row]
}

function createActions(db: Database, commit: (next: Database) => void) {
  return {
    ...createApiActions(async () => { commit(await request<Database>("/dados")) }),

    /** Cria/atualiza o VOLUNTARIO e o vínculo ATUA (com a Função) no abrigo. */
    salvarVoluntario(cnpj: string, voluntario: Voluntario, funcao: string) {
      commit({
        ...db,
        voluntario: upsert(db.voluntario, voluntario, (v) => v.cpf === voluntario.cpf),
        atua: upsert(
          db.atua,
          { cnpj_abrigo: cnpj, cpf_voluntario: voluntario.cpf, funcao },
          (a) => a.cnpj_abrigo === cnpj && a.cpf_voluntario === voluntario.cpf
        ),
      })
    },

    /** Remove o ATUA e as participações (PARTICIPA) do voluntário nas feiras deste abrigo. */
    removerVoluntario(cnpj: string, cpf: string) {
      const feiras = new Set(db.feira_adocao.filter((f) => f.cnpj_abrigo === cnpj).map((f) => f.id))
      commit({
        ...db,
        atua: db.atua.filter((a) => !(a.cnpj_abrigo === cnpj && a.cpf_voluntario === cpf)),
        participa: db.participa.filter((p) => !(p.cpf_voluntario === cpf && feiras.has(p.id_feira_adocao))),
      })
    },

    /** Cria/atualiza o VETERINARIO e garante o VINCULO com o abrigo. */
    salvarVeterinario(cnpj: string, vet: Veterinario) {
      if (db.veterinario.some((v) => v.crmv.toUpperCase() === vet.crmv.toUpperCase() && v.cpf !== vet.cpf))
        throw new DbError("Este CRMV já pertence a outro veterinário.")
      const vinculado = db.vinculo.some((v) => v.cnpj_abrigo === cnpj && v.cpf_veterinario === vet.cpf)
      commit({
        ...db,
        veterinario: upsert(db.veterinario, vet, (v) => v.cpf === vet.cpf),
        vinculo: vinculado ? db.vinculo : [...db.vinculo, { cnpj_abrigo: cnpj, cpf_veterinario: vet.cpf }],
      })
    },

    removerVinculo(cnpj: string, cpf: string) {
      commit({ ...db, vinculo: db.vinculo.filter((v) => !(v.cnpj_abrigo === cnpj && v.cpf_veterinario === cpf)) })
    },

    /** Cria/edita a FEIRA_ADOCAO e substitui a lista de voluntários (PARTICIPA). */
    salvarFeira(feira: WithOptionalId<FeiraAdocao>, participantes: string[]) {
      const id = feira.id ?? nextId(db.feira_adocao)
      commit({
        ...db,
        feira_adocao: upsert(db.feira_adocao, { ...feira, id }, (f) => f.id === id),
        participa: [
          ...db.participa.filter((p) => p.id_feira_adocao !== id),
          ...participantes.map((cpf) => ({ cpf_voluntario: cpf, id_feira_adocao: id })),
        ],
      })
    },

    removerFeira(id: number) {
      commit({
        ...db,
        feira_adocao: db.feira_adocao.filter((f) => f.id !== id),
        participa: db.participa.filter((p) => p.id_feira_adocao !== id),
      })
    },
  }
}

type DbContextValue = { db: Database; actions: ReturnType<typeof createActions> }

const DbContext = createContext<DbContextValue | null>(null)

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(mockDb)
  const actions = createActions(db, setDb)
  return <DbContext.Provider value={{ db, actions }}>{children}</DbContext.Provider>
}

export function useDb() {
  const ctx = useContext(DbContext)
  if (!ctx) throw new Error("useDb deve ser usado dentro de <DbProvider>")
  return ctx
}
