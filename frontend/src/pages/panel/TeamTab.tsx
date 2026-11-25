import type { ReactNode } from "react"
import { Pencil, Stethoscope, Trash2, Unlink, UserPlus, Users } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Confirm, EmptyState, attempt } from "@/components/common"
import { VetDialog, VolunteerDialog } from "@/components/dialogs/TeamDialogs"
import { applyMask, iniciais } from "@/lib/format"
import { veterinariosDoAbrigo, voluntariosDoAbrigo } from "@/lib/queries"
import { useDb } from "@/store/db"

export function TeamTab({ cnpj }: { cnpj: string }) {
  const { db, actions } = useDb()
  const voluntarios = voluntariosDoAbrigo(db, cnpj)
  const vets = veterinariosDoAbrigo(db, cnpj)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="grid content-start gap-4 rounded-3xl bg-card p-4 ring-1 ring-foreground/5 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="size-5 text-primary" /> Voluntários <span className="text-sm font-normal text-muted-foreground">({voluntarios.length})</span>
          </h2>
          <VolunteerDialog cnpj={cnpj} trigger={<Button size="sm"><UserPlus /> Adicionar</Button>} />
        </div>
        {voluntarios.length === 0 ? (
          <EmptyState icon={<Users className="size-5" />} title="Nenhum voluntário" />
        ) : (
          <ul className="grid gap-1.5">
            {voluntarios.map((v) => (
              <Person
                key={v.cpf}
                nome={v.nome}
                badge={<Badge className="bg-primary/15 text-primary">{v.funcao}</Badge>}
                detalhe={[v.email, v.telefone && applyMask("telefone", v.telefone)].filter(Boolean).join(" · ") || "Sem contato"}
              >
                <VolunteerDialog cnpj={cnpj} voluntario={v} trigger={<Button variant="ghost" size="icon-sm" aria-label="Editar"><Pencil /></Button>} />
                <Confirm
                  title={`Remover ${v.nome}?`}
                  description="O voluntário deixa a equipe deste abrigo e é retirado das feiras do abrigo. O cadastro dele na plataforma é mantido."
                  confirmLabel="Remover"
                  onConfirm={() => attempt(() => actions.removerVoluntario(cnpj, v.cpf), "Voluntário removido da equipe.")}
                  trigger={<Button variant="ghost" size="icon-sm" aria-label="Remover"><Trash2 /></Button>}
                />
              </Person>
            ))}
          </ul>
        )}
      </section>

      <section className="grid content-start gap-4 rounded-3xl bg-card p-4 ring-1 ring-foreground/5 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Stethoscope className="size-5 text-primary" /> Veterinários <span className="text-sm font-normal text-muted-foreground">({vets.length})</span>
          </h2>
          <VetDialog cnpj={cnpj} trigger={<Button size="sm"><UserPlus /> Vincular</Button>} />
        </div>
        {vets.length === 0 ? (
          <EmptyState icon={<Stethoscope className="size-5" />} title="Nenhum veterinário vinculado">
            Vincule um profissional para registrar atendimentos clínicos.
          </EmptyState>
        ) : (
          <ul className="grid gap-1.5">
            {vets.map((v) => {
              const outros = db.vinculo.filter((x) => x.cpf_veterinario === v.cpf && x.cnpj_abrigo !== cnpj).length
              return (
                <Person
                  key={v.cpf}
                  nome={v.nome}
                  badge={<Badge variant="secondary">CRMV {v.crmv}</Badge>}
                  detalhe={
                    [v.email, v.telefone && applyMask("telefone", v.telefone)].filter(Boolean).join(" · ") +
                    (outros ? ` · atende +${outros} abrigo(s)` : "")
                  }
                >
                  <VetDialog cnpj={cnpj} vet={v} trigger={<Button variant="ghost" size="icon-sm" aria-label="Editar"><Pencil /></Button>} />
                  <Confirm
                    title={`Desvincular ${v.nome}?`}
                    description="O vínculo com este abrigo é removido. O histórico de atendimentos já registrados é mantido."
                    confirmLabel="Desvincular"
                    onConfirm={() => attempt(() => actions.removerVinculo(cnpj, v.cpf), "Veterinário desvinculado.")}
                    trigger={<Button variant="ghost" size="icon-sm" aria-label="Desvincular"><Unlink /></Button>}
                  />
                </Person>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function Person({ nome, badge, detalhe, children }: { nome: string; badge: ReactNode; detalhe: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-muted/60">
      <Avatar className="size-10">
        <AvatarFallback className="bg-primary/15 font-medium text-primary">{iniciais(nome)}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{nome}</span>
          {badge}
        </div>
        <span className="truncate text-xs text-muted-foreground">{detalhe}</span>
      </div>
      <div className="flex shrink-0">{children}</div>
    </li>
  )
}
