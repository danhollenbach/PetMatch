import { Link, useParams } from "react-router-dom"
import { Building2, CalendarHeart, HandHeart, LayoutDashboard, MapPin, Phone, PawPrint } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AnimalCard } from "@/components/AnimalCard"
import { DateBlock, EmptyState } from "@/components/common"
import { DonationDialog } from "@/components/dialogs/DonationDialog"
import { applyMask, formatDateLong, today } from "@/lib/format"
import { abrigoPorCnpj, feirasDoAbrigo, ocupacao } from "@/lib/queries"
import { useDb } from "@/store/db"
import { useSession } from "@/store/session"

export function ShelterPage() {
  const { cnpj = "" } = useParams()
  const { db } = useDb()
  const session = useSession()
  const abrigo = abrigoPorCnpj(db, cnpj)

  if (!abrigo)
    return (
      <EmptyState icon={<Building2 className="size-5" />} title="Abrigo não encontrado">
        <Link to="/" className="text-primary underline">
          Voltar ao catálogo
        </Link>
      </EmptyState>
    )

  const animais = db.animal.filter((a) => a.cnpj_abrigo === cnpj)
  const disponiveis = animais.filter((a) => a.status === "disponivel")
  const adotados = animais.filter((a) => a.status === "adotado").length
  const ocup = ocupacao(db, cnpj)
  const feiras = feirasDoAbrigo(db, cnpj).filter((f) => f.data >= today())

  return (
    <div className="grid gap-8">
      <section className="grid gap-6 rounded-3xl bg-card p-5 ring-1 ring-foreground/5 sm:p-7 lg:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-4">
          <div className="flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-3xl bg-primary text-primary-foreground">
              <Building2 className="size-7" />
            </span>
            <div className="grid gap-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{abrigo.nome}</h1>
              <p className="text-sm text-muted-foreground">CNPJ {applyMask("cnpj", abrigo.cnpj)}</p>
            </div>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p className="flex items-start gap-2 rounded-2xl bg-muted/60 px-4 py-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                {abrigo.logradouro}
                <br />
                <span className="text-muted-foreground">
                  {abrigo.cidade}/{abrigo.uf}
                  {abrigo.cep && ` · CEP ${applyMask("cep", abrigo.cep)}`}
                </span>
              </span>
            </p>
            <a href={`tel:${abrigo.telefone}`} className="flex items-center gap-2 rounded-2xl bg-muted/60 px-4 py-3 hover:bg-muted">
              <Phone className="size-4 shrink-0 text-primary" />
              {applyMask("telefone", abrigo.telefone)}
            </a>
          </div>
          <div className="flex flex-wrap gap-2">
            <DonationDialog
              cnpj={cnpj}
              trigger={
                <Button size="lg">
                  <HandHeart /> Doar para o abrigo
                </Button>
              }
            />
            {session.cnpj === cnpj && (
              <Button asChild size="lg" variant="outline">
                <Link to="/painel">
                  <LayoutDashboard /> Abrir painel
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid content-start gap-4 rounded-3xl bg-muted/60 p-5">
          <p className="text-sm text-muted-foreground">Ocupação atual</p>
          <p className="text-4xl font-semibold">
            {ocup}
            <span className="text-lg font-normal text-muted-foreground"> / {abrigo.capacidade}</span>
          </p>
          <Progress value={(ocup / abrigo.capacidade) * 100} />
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl bg-card px-3 py-2">
              <p className="text-xl font-semibold">{Math.max(0, abrigo.capacidade - ocup)}</p>
              <p className="text-xs text-muted-foreground">vagas livres</p>
            </div>
            <div className="rounded-2xl bg-card px-3 py-2">
              <p className="text-xl font-semibold">{adotados}</p>
              <p className="text-xs text-muted-foreground">já adotados</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <PawPrint className="size-5 text-primary" /> Disponíveis para adoção
          <span className="text-base font-normal text-muted-foreground">({disponiveis.length})</span>
        </h2>
        {disponiveis.length === 0 ? (
          <EmptyState icon={<PawPrint className="size-5" />} title="Nenhum animal disponível agora">
            Volte em breve ou ajude o abrigo com uma doação.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {disponiveis.map((a) => (
              <AnimalCard key={a.id} animal={a} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <CalendarHeart className="size-5 text-primary" /> Próximas feiras de adoção
        </h2>
        {feiras.length === 0 ? (
          <p className="rounded-3xl bg-card px-5 py-4 text-sm text-muted-foreground ring-1 ring-foreground/5">Nenhuma feira agendada no momento.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {feiras.map((f) => (
              <div key={f.id} className="flex items-center gap-4 rounded-3xl bg-card p-4 ring-1 ring-foreground/5">
                <DateBlock iso={f.data} />
                <div className="grid min-w-0">
                  <p className="truncate font-medium">{f.nome}</p>
                  <p className="truncate text-sm text-muted-foreground">{f.logradouro}</p>
                  <p className="text-xs text-muted-foreground">{formatDateLong(f.data)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
