import type {
  Especie,
  EspecieAlvo,
  StatusAnimal,
  StatusPedido,
  TipoAtendimento,
  TipoDoacao,
} from "@/types/db"

export const onlyDigits = (v: string) => v.replace(/\D/g, "")

/** Data de hoje em ISO (YYYY-MM-DD), no fuso local. */
export function today() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

export function formatDateLong(iso: string) {
  const s = new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function idade(iso: string | null) {
  if (!iso) return "Idade desconhecida"
  const nasc = new Date(`${iso}T00:00:00`)
  const agora = new Date()
  let meses = (agora.getFullYear() - nasc.getFullYear()) * 12 + agora.getMonth() - nasc.getMonth()
  if (agora.getDate() < nasc.getDate()) meses--
  if (meses < 1) return "Recém-nascido"
  if (meses < 12) return `${meses} ${meses === 1 ? "mês" : "meses"}`
  const anos = Math.floor(meses / 12)
  return `${anos} ${anos === 1 ? "ano" : "anos"}`
}

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export const formatPeso = (v: number | null) =>
  v == null ? "—" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`

function mask(digits: string, pattern: string) {
  let i = 0
  let out = ""
  for (const ch of pattern) {
    if (i >= digits.length) break
    out += ch === "#" ? digits[i++] : ch
  }
  return out
}

export type MaskKind = "cpf" | "cnpj" | "cep" | "telefone" | "documento"

export function applyMask(kind: MaskKind, raw: string | null | undefined) {
  const d = onlyDigits(raw ?? "")
  switch (kind) {
    case "cpf":
      return mask(d, "###.###.###-##")
    case "cnpj":
      return mask(d, "##.###.###/####-##")
    case "cep":
      return mask(d, "#####-###")
    case "telefone":
      return d.length > 10 ? mask(d, "(##) #####-####") : mask(d, "(##) ####-####")
    case "documento":
      return d.length > 11 ? mask(d, "##.###.###/####-##") : mask(d, "###.###.###-##")
  }
}

export const maxDigits: Record<MaskKind, number> = {
  cpf: 11,
  cnpj: 14,
  cep: 8,
  telefone: 11,
  documento: 14,
}

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

export const especieLabel: Record<EspecieAlvo, string> = {
  cachorro: "Cachorro",
  gato: "Gato",
  ambos: "Cães e gatos",
}

export const especieOptions: { value: Especie; label: string }[] = [
  { value: "cachorro", label: "Cachorro" },
  { value: "gato", label: "Gato" },
]

export const statusAnimalLabel: Record<StatusAnimal, string> = {
  disponivel: "Disponível",
  em_tratamento: "Em tratamento",
  reservado: "Reservado",
  adotado: "Adotado",
}

export const statusPedidoLabel: Record<StatusPedido, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
}

export const tipoAtendimentoLabel: Record<TipoAtendimento, string> = {
  consulta: "Consulta",
  retorno: "Retorno",
  exame: "Exame",
  cirurgia: "Cirurgia",
  emergencia: "Emergência",
}

export const tipoDoacaoLabel: Record<TipoDoacao, string> = {
  dinheiro: "Dinheiro",
  insumo: "Insumos",
}

export const FUNCOES = [
  "Coordenação",
  "Cuidados diários",
  "Lar temporário",
  "Transporte",
  "Eventos",
  "Comunicação",
  "Captação de recursos",
]

export const sexoLabel = (s: "M" | "F") => (s === "M" ? "Macho" : "Fêmea")

export function iniciais(nome: string) {
  const partes = nome.replace(/^(Dra?\.)\s+/i, "").split(/\s+/)
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase()
}
