import { Link, useSearchParams } from "react-router-dom"
import { Building2, CalendarHeart, ExternalLink, Inbox, LayoutDashboard, Pencil, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/common"
import { ShelterDialog } from "@/components/dialogs/ShelterDialog"
import { applyMask } from "@/lib/format"
import { abrigoPorCnpj, pedidosDoAbrigo } from "@/lib/queries"
import { useDb } from "@/store/db"
import { useSession } from "@/store/session"
import { FairsTab } from "./panel/FairsTab"
import { OverviewTab } from "./panel/OverviewTab"
import { RequestsTab } from "./panel/RequestsTab"
import { TeamTab } from "./panel/TeamTab"

const tabClass = "rounded-full px-4 dark:data-active:border-transparent dark:data-active:bg-primary/15 dark:data-active:text-primary"

const ABAS = ["geral", "pedidos", "equipe", "feiras"] as const
type Aba = (typeof ABAS)[number]

/** Área exclusiva do abrigo: Visão geral, Pedidos, Equipe e Feiras em abas (sincronizadas com ?aba=). */
export function PanelPage() {
  const { db } = useDb()
  const { cnpj, setCnpj } = useSession()
  const [params, setParams] = useSearchParams()
  const abrigo = cnpj ? abrigoPorCnpj(db, cnpj) : undefined

  if (!abrigo)
    return (
      <div className="mx-auto grid max-w-xl gap-4 pt-8">
        <EmptyState icon={<LayoutDashboard className="size-5" />} title="Área exclusiva para abrigos">
          Escolha um abrigo no seletor de sessão da barra superior ou cadastre um novo abrigo para acessar o painel.
        </EmptyState>
        <div className="flex flex-wrap justify-center gap-2">
          {db.abrigo.map((a) => (
            <Button key={a.cnpj} variant="outline" size="sm" onClick={() => setCnpj(a.cnpj)}>
              <Building2 /> {a.nome}
            </Button>
          ))}
        </div>
      </div>
    )

  const aba: Aba = ABAS.includes(params.get("aba") as Aba) ? (params.get("aba") as Aba) : "geral"
  const irPara = (a: Aba) => setParams(a === "geral" ? {} : { aba: a }, { replace: true })
  const pendentes = pedidosDoAbrigo(db, abrigo.cnpj).filter((p) => p.status === "pendente").length

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <p className="text-sm font-medium text-primary">Painel do abrigo</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{abrigo.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {abrigo.cidade}/{abrigo.uf} · CNPJ {applyMask("cnpj", abrigo.cnpj)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ShelterDialog abrigo={abrigo} trigger={<Button variant="outline"><Pencil /> Editar dados</Button>} />
          <Button asChild variant="outline">
            <Link to={`/abrigos/${abrigo.cnpj}`}>
              <ExternalLink /> Página pública
            </Link>
          </Button>
        </div>
      </header>

      <Tabs value={aba} onValueChange={(v) => irPara(v as Aba)} className="gap-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-11! bg-muted/70">
            <TabsTrigger value="geral" className={tabClass}>
              <LayoutDashboard /> Visão geral
            </TabsTrigger>
            <TabsTrigger value="pedidos" className={tabClass}>
              <Inbox /> Pedidos
              {pendentes > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                  {pendentes}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="equipe" className={tabClass}>
              <Users /> Equipe
            </TabsTrigger>
            <TabsTrigger value="feiras" className={tabClass}>
              <CalendarHeart /> Feiras
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="geral">
          <OverviewTab cnpj={abrigo.cnpj} irPara={irPara} />
        </TabsContent>
        <TabsContent value="pedidos">
          <RequestsTab cnpj={abrigo.cnpj} />
        </TabsContent>
        <TabsContent value="equipe">
          <TeamTab cnpj={abrigo.cnpj} />
        </TabsContent>
        <TabsContent value="feiras">
          <FairsTab cnpj={abrigo.cnpj} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
