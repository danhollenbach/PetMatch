import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { createApiActions } from "./actions"
import { ApiError, request } from "@/lib/api"
import type { Database } from "@/types/db"

type DbContextValue = { db: Database; actions: ReturnType<typeof createApiActions> }
const DbContext = createContext<DbContextValue | null>(null)

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const generation = useRef(0)
  const reload = useCallback(async (saved = false) => {
    const current = ++generation.current
    try {
      const data = await request<Database>("/dados")
      if (generation.current !== current) return
      setDb(data); setError(null)
    } catch (cause) {
      if (generation.current !== current) return
      const failure = cause instanceof Error ? cause : new Error("Falha ao carregar dados.")
      // A escrita já confirmou: não lançar erro que incentive repetir uma inclusão.
      setError(saved ? new Error(`Operação salva. Não foi possível atualizar a tela: ${failure.message} Recarregue os dados antes de continuar.`) : failure)
    } finally { if (generation.current === current) setLoading(false) }
  }, [])
  useEffect(() => { void reload(); return () => { generation.current++ } }, [reload])
  const actions = createApiActions(() => reload(true))
  if (loading) return <main className="grid min-h-screen place-content-center p-8" role="status">Carregando PetMatch…</main>
  if (error || !db) return <main className="mx-auto grid min-h-screen max-w-xl content-center gap-4 p-8">
    <h1 className="text-2xl font-semibold">{error instanceof ApiError && error.code === "SQL_NOT_IMPLEMENTED" ? "Banco aguardando consultas" : "Dados indisponíveis"}</h1>
    <p role="alert">{error?.message ?? "Não foi possível carregar os dados."}</p>
    {error instanceof ApiError && error.queries.length > 0 && <details>
      <summary>Consultas pendentes</summary>
      <ul className="mt-2 list-inside list-disc text-sm">{error.queries.map(query => <li key={query}>{query}</li>)}</ul>
    </details>}
    <button className="rounded-xl bg-primary p-3 text-primary-foreground" onClick={() => { setLoading(true); void reload() }}>Tentar novamente</button>
  </main>
  return <DbContext.Provider value={{ db, actions }}>{children}</DbContext.Provider>
}

export function useDb() {
  const ctx = useContext(DbContext)
  if (!ctx) throw new Error("useDb deve ser usado dentro de <DbProvider>")
  return ctx
}
