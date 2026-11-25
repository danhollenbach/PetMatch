import { CalendarHeart, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Confirm, DateBlock, EmptyState, attempt } from "@/components/common"
import { FairDialog } from "@/components/dialogs/TeamDialogs"
import { formatDateLong, iniciais, today } from "@/lib/format"
import { feirasDoAbrigo } from "@/lib/queries"
import { useDb } from "@/store/db"

export function FairsTab({ cnpj }: { cnpj: string }) {
  const { db } = useDb()
  const feiras = feirasDoAbrigo(db, cnpj)
  const hoje = today()
  const proximas = feiras.filter((f) => f.data >= hoje)
  const realizadas = feiras.filter((f) => f.data < hoje).reverse()

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Organize eventos e escale voluntários da equipe para cada feira.</p>
        <FairDialog cnpj={cnpj} trigger={<Button><Plus /> Nova feira</Button>} />
      </div>

      {feiras.length === 0 && (
        <EmptyState icon={<CalendarHeart className="size-5" />} title="Nenhuma feira cadastrada">
          Feiras de adoção aumentam muito as chances de cada animal encontrar um lar.
        </EmptyState>
      )}

      {proximas.length > 0 && <FairList titulo="Próximas" feiras={proximas} cnpj={cnpj} />}
      {realizadas.length > 0 && <FairList titulo="Realizadas" feiras={realizadas} cnpj={cnpj} passadas />}
    </div>
  )
}

function FairList({
  titulo,
  feiras,
  cnpj,
  passadas,
}: {
  titulo: string
  feiras: ReturnType<typeof feirasDoAbrigo>
  cnpj: string
  passadas?: boolean
}) {
  const { actions } = useDb()
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {feiras.map((f) => (
          <article key={f.id} className="grid gap-4 rounded-3xl bg-card p-4 ring-1 ring-foreground/5 sm:p-5">
            <div className="flex items-start gap-4">
              <DateBlock iso={f.data} muted={passadas} />
              <div className="grid min-w-0 flex-1 gap-1">
                <h3 className="font-semibold">{f.nome}</h3>
                <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" /> {f.logradouro}
                </p>
                <p className="text-xs text-muted-foreground">{formatDateLong(f.data)}</p>
              </div>
              <div className="flex shrink-0">
                <FairDialog cnpj={cnpj} feira={f} trigger={<Button variant="ghost" size="icon-sm" aria-label="Editar feira"><Pencil /></Button>} />
                <Confirm
                  title="Excluir feira?"
                  description={`“${f.nome}” e a escala de voluntários serão removidas.`}
                  confirmLabel="Excluir"
                  onConfirm={() => attempt(() => actions.removerFeira(f.id), "Feira excluída.")}
                  trigger={<Button variant="ghost" size="icon-sm" aria-label="Excluir feira"><Trash2 /></Button>}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 p-3">
              {f.participantes.length === 0 ? (
                <span className="text-sm text-muted-foreground">Nenhum voluntário escalado</span>
              ) : (
                <div className="flex min-w-0 items-center gap-3">
                  <AvatarGroup>
                    {f.participantes.slice(0, 4).map((p) => (
                      <Avatar key={p.cpf} className="size-8">
                        <AvatarFallback className="bg-primary/20 text-xs text-primary">{iniciais(p.nome)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </AvatarGroup>
                  <span className="truncate text-sm text-muted-foreground">{f.participantes.map((p) => p.nome.split(" ")[0]).join(", ")}</span>
                </div>
              )}
              <FairDialog
                cnpj={cnpj}
                feira={f}
                somenteEquipe
                trigger={
                  <Button size="sm" variant="outline" className="shrink-0">
                    <Users /> Voluntários
                  </Button>
                }
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
