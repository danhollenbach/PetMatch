import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Building2, Cat, Dog, PawPrint, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimalCard } from "@/components/AnimalCard"
import { EmptyState, Segmented, SelectField } from "@/components/common"
import { ocupacao } from "@/lib/queries"
import { useDb } from "@/store/db"
import type { Especie } from "@/types/db"

const TODOS = "todos"

const filtrosIniciais = {
  busca: "",
  especie: TODOS as Especie | typeof TODOS,
  raca: TODOS,
  sexo: TODOS,
  castrado: TODOS,
  uf: TODOS,
  cidade: TODOS,
}

export function CatalogPage() {
  const { db } = useDb()
  const [f, setF] = useState(filtrosIniciais)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))

  const abrigos = useMemo(() => new Map(db.abrigo.map((a) => [a.cnpj, a])), [db.abrigo])
  const disponiveis = useMemo(() => db.animal.filter((a) => a.status === "disponivel"), [db.animal])

  // opções dependentes: raça segue a espécie; cidade segue a UF
  const racas = [...new Set(disponiveis.filter((a) => f.especie === TODOS || a.especie === f.especie).map((a) => a.raca))].sort()
  const ufs = [...new Set(db.abrigo.map((a) => a.uf))].sort()
  const cidades = [...new Set(db.abrigo.filter((a) => f.uf === TODOS || a.uf === f.uf).map((a) => a.cidade))].sort()

  const resultado = disponiveis.filter((a) => {
    const abrigo = abrigos.get(a.cnpj_abrigo)!
    const termo = f.busca.trim().toLowerCase()
    return (
      (!termo || a.nome.toLowerCase().includes(termo) || a.raca.toLowerCase().includes(termo)) &&
      (f.especie === TODOS || a.especie === f.especie) &&
      (f.raca === TODOS || a.raca === f.raca) &&
      (f.sexo === TODOS || a.sexo === f.sexo) &&
      (f.castrado === TODOS || String(a.castrado) === f.castrado) &&
      (f.uf === TODOS || abrigo.uf === f.uf) &&
      (f.cidade === TODOS || abrigo.cidade === f.cidade)
    )
  })

  const filtrando = JSON.stringify(f) !== JSON.stringify(filtrosIniciais)

  return (
    <div className="grid gap-8">
      <section className="grid gap-2 pt-2">
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <PawPrint className="size-4" /> {disponiveis.length} animais esperando por um lar em {db.abrigo.length} abrigos
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Encontre seu novo melhor amigo</h1>
        <p className="max-w-2xl text-muted-foreground">
          Conheça cães e gatos de abrigos parceiros de todo o Brasil, veja a ficha de saúde de cada um e envie seu pedido de adoção.
        </p>
      </section>

      <section className="grid gap-3 rounded-3xl bg-card p-4 ring-1 ring-foreground/5 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-10 pl-10" placeholder="Buscar por nome ou raça" value={f.busca} onChange={(e) => set("busca", e.target.value)} />
          </div>
          <Segmented
            value={f.especie}
            onChange={(v) => setF((s) => ({ ...s, especie: v, raca: TODOS }))}
            options={[
              { value: TODOS, label: "Todos" },
              { value: "cachorro", label: <><Dog className="size-4" /> Cães</> },
              { value: "gato", label: <><Cat className="size-4" /> Gatos</> },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <SelectField value={f.raca} onChange={(v) => set("raca", v)} options={[{ value: TODOS, label: "Todas as raças" }, ...racas.map((r) => ({ value: r, label: r }))]} />
          <SelectField
            value={f.sexo}
            onChange={(v) => set("sexo", v)}
            options={[
              { value: TODOS, label: "Qualquer sexo" },
              { value: "M", label: "Macho" },
              { value: "F", label: "Fêmea" },
            ]}
          />
          <SelectField
            value={f.castrado}
            onChange={(v) => set("castrado", v)}
            options={[
              { value: TODOS, label: "Castração" },
              { value: "true", label: "Castrado" },
              { value: "false", label: "Não castrado" },
            ]}
          />
          <SelectField
            value={f.uf}
            onChange={(v) => setF((s) => ({ ...s, uf: v, cidade: TODOS }))}
            options={[{ value: TODOS, label: "Todos os estados" }, ...ufs.map((u) => ({ value: u, label: u }))]}
          />
          <SelectField
            value={f.cidade}
            onChange={(v) => set("cidade", v)}
            className="col-span-2 md:col-span-1"
            options={[{ value: TODOS, label: "Todas as cidades" }, ...cidades.map((c) => ({ value: c, label: c }))]}
          />
        </div>
        <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
          <span>
            {resultado.length} {resultado.length === 1 ? "animal encontrado" : "animais encontrados"}
          </span>
          {filtrando && (
            <Button variant="ghost" size="sm" onClick={() => setF(filtrosIniciais)}>
              <X /> Limpar filtros
            </Button>
          )}
        </div>
      </section>

      {resultado.length === 0 ? (
        <EmptyState icon={<Search className="size-5" />} title="Nenhum animal com esses filtros">
          Tente ampliar a busca ou limpar os filtros.
        </EmptyState>
      ) : (
        <section className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {resultado.map((a) => (
            <AnimalCard key={a.id} animal={a} abrigo={abrigos.get(a.cnpj_abrigo)} />
          ))}
        </section>
      )}

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Abrigos parceiros</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {db.abrigo.map((a) => {
            const livres = disponiveis.filter((x) => x.cnpj_abrigo === a.cnpj).length
            return (
              <Link
                key={a.cnpj}
                to={`/abrigos/${a.cnpj}`}
                className="flex items-center gap-3 rounded-3xl bg-card p-4 ring-1 ring-foreground/5 transition-colors hover:ring-primary/40"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
                  <Building2 className="size-5" />
                </span>
                <span className="grid min-w-0">
                  <span className="truncate font-medium">{a.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    {a.cidade}/{a.uf} · {livres} para adoção · ocupação {ocupacao(db, a.cnpj)}/{a.capacidade}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
