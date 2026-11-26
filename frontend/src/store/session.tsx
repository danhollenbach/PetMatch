import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export const ACCENTS = [
  { id: "emerald", label: "Esmeralda", swatch: "oklch(0.78 0.15 163)" },
  { id: "amber", label: "Âmbar", swatch: "oklch(0.82 0.15 75)" },
  { id: "violet", label: "Violeta", swatch: "oklch(0.74 0.16 295)" },
  { id: "sky", label: "Azul-céu", swatch: "oklch(0.78 0.12 232)" },
  { id: "rose", label: "Rosa", swatch: "oklch(0.75 0.15 10)" },
] as const

export type AccentId = (typeof ACCENTS)[number]["id"]

type SessionValue = {
  /** CNPJ do abrigo gerenciado; null = visitante público. */
  cnpj: string | null
  setCnpj: (cnpj: string | null) => void
  accent: AccentId
  setAccent: (a: AccentId) => void
}

const SessionContext = createContext<SessionValue | null>(null)

function storedAccent(): AccentId {
  try {
    const v = localStorage.getItem("accent")
    if (ACCENTS.some((a) => a.id === v)) return v as AccentId
  } catch {
    /* armazenamento indisponível */
  }
  return "emerald"
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [cnpj, setCnpj] = useState<string | null>(null)
  const [accent, setAccent] = useState<AccentId>(storedAccent)

  useEffect(() => {
    document.documentElement.dataset.accent = accent
    try {
      localStorage.setItem("accent", accent)
    } catch {
      /* armazenamento indisponível */
    }
  }, [accent])

  return (
    <SessionContext.Provider value={{ cnpj, setCnpj, accent, setAccent }}>{children}</SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession deve ser usado dentro de <SessionProvider>")
  return ctx
}
