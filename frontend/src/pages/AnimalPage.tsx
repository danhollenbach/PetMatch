import { AnimalPhoto } from "@/components/AnimalPhoto"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Building2, Heart, HeartPulse, Pencil, PawPrint, ShieldCheck, Stethoscope, Syringe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Confirm, attempt, EmptyState, Info, StatusAnimalBadge } from "@/components/common"
import { AdoptionDialog } from "@/components/dialogs/AdoptionDialog"
import { AnimalDialog } from "@/components/dialogs/AnimalDialog"
import { VaccineDialog, VisitDialog } from "@/components/dialogs/ClinicalDialogs"
import {
  applyMask,
  especieLabel,
  formatDate,
  formatPeso,
  idade,
  sexoLabel,
  tipoAtendimentoLabel,
} from "@/lib/format"
import { abrigoPorCnpj, atendimentosDoProntuario, prontuarioDoAnimal, vacinasDoProntuario } from "@/lib/queries"
import { useDb } from "@/store/db"
import { useSession } from "@/store/session"

export function AnimalPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { db, actions } = useDb()
  const { cnpj } = useSession()

  const animal = db.animal.find((a) => a.id === Number(id))
  if (!animal)
    return (
      <EmptyState icon={<PawPrint className="size-5" />} title="Animal não encontrado">
        <Link to="/" className="text-primary underline">
          Voltar ao catálogo
        </Link>
      </EmptyState>
    )

  const abrigo = abrigoPorCnpj(db, animal.cnpj_abrigo)!
  const pront = prontuarioDoAnimal(db, animal.id)!
  const vacinas = vacinasDoProntuario(db, pront.id)
  const membro = cnpj === animal.cnpj_abrigo
  const atendimentos = membro ? atendimentosDoProntuario(db, pront.id) : []
  const pendentes = db.pedido_adocao.filter((p) => p.id_animal === animal.id && p.status === "pendente").length

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft /> Voltar
        </Button>
        {membro && (
          <Badge className="h-7 gap-1.5 bg-primary/15 px-3 text-primary">
            <ShieldCheck /> Visão clínica do abrigo
          </Badge>
        )}
      </div>

      <section className="grid gap-6 rounded-3xl bg-card p-4 ring-1 ring-foreground/5 sm:p-6 md:grid-cols-[minmax(0,380px)_1fr]">
        <div className="relative">
          <AnimalPhoto key={animal.id} animal={animal} editable={membro} />
          <StatusAnimalBadge status={animal.status} className="absolute top-4 left-4 h-6 px-3 text-sm" />
        </div>

        <div className="grid content-start gap-5">
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{animal.nome}</h1>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{especieLabel[animal.especie]}</Badge>
              <Badge variant="secondary">{sexoLabel(animal.sexo)}</Badge>
              <Badge variant="secondary">{animal.castrado ? "Castrado(a)" : "Não castrado(a)"}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <Info label="Raça">{animal.raca}</Info>
            <Info label="Idade">{idade(animal.data_nascimento)}</Info>
            <Info label="Nascimento">{formatDate(animal.data_nascimento)}</Info>
            <Info label="Peso atual">{formatPeso(pront.peso)}</Info>
          </div>

          <Link
            to={`/abrigos/${abrigo.cnpj}`}
            className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3 transition-colors hover:bg-muted"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
              <Building2 className="size-5" />
            </span>
            <span className="grid min-w-0">
              <span className="truncate font-medium">{abrigo.nome}</span>
              <span className="text-xs text-muted-foreground">
                {abrigo.cidade}/{abrigo.uf} · {applyMask("telefone", abrigo.telefone)}
              </span>
            </span>
          </Link>

          {animal.status === "disponivel" ? (
            <AdoptionDialog
              animal={animal}
              trigger={
                <Button size="lg" className="h-12 text-base sm:w-fit sm:px-8">
                  <Heart /> Solicitar adoção
                </Button>
              }
            />
          ) : (
            <p className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              {animal.status === "adotado"
                ? `${animal.nome} já encontrou um lar! 💛`
                : `${animal.nome} não está disponível para adoção no momento.`}
            </p>
          )}

          {membro && (
            <div className="grid gap-2 rounded-2xl border border-dashed border-primary/30 p-3">
              <p className="px-1 text-xs font-medium text-primary">
                Ações do abrigo {pendentes > 0 && `· ${pendentes} pedido(s) pendente(s)`}
              </p>
              <div className="flex flex-wrap gap-2">
                <Confirm title="Excluir animal?" description="A exclusão só é permitida sem histórico clínico ou de adoção. O prontuário vazio e a foto também serão removidos."
                  trigger={<Button variant="destructive">Excluir animal</Button>}
                  onConfirm={async () => { const ok = await attempt(() => actions.removerAnimal(animal.id), "Animal excluído."); if (ok) navigate("/"); return ok }} />
                <AnimalDialog cnpj={abrigo.cnpj} animal={animal} trigger={<Button variant="secondary"><Pencil /> Editar animal / prontuário</Button>} />
                <VisitDialog animal={animal} prontuario={pront} trigger={<Button variant="secondary"><Stethoscope /> Novo atendimento</Button>} />
                <VaccineDialog animal={animal} prontuario={pront} trigger={<Button variant="secondary"><Syringe /> Registrar vacina</Button>} />
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="grid content-start gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <HeartPulse className="size-5 text-primary" /> Prontuário
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <Info label="Aberto em">{formatDate(pront.data_abertura)}</Info>
            <Info label="Peso">{formatPeso(pront.peso)}</Info>
            <Info label="Alergias" className="col-span-2">
              {pront.alergias ?? <span className="text-muted-foreground">Nenhuma conhecida</span>}
            </Info>
            <Info label="Observações" className="col-span-2">
              <span className="font-normal">{pront.observacoes ?? <span className="text-muted-foreground">Sem observações</span>}</span>
            </Info>
          </div>
        </section>

        <section className="grid content-start gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Syringe className="size-5 text-primary" /> Vacinas aplicadas
            <span className="text-sm font-normal text-muted-foreground">({vacinas.length})</span>
          </h2>
          {vacinas.length === 0 ? (
            <p className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">Nenhuma vacina registrada ainda.</p>
          ) : (
            <ul className="grid gap-2">
              {vacinas.map((v) => (
                <li key={`${v.id_vacina}-${v.dose}`} className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-sm font-semibold text-primary">
                    {v.dose}ª
                  </span>
                  <span className="grid min-w-0 flex-1">
                    <span className="font-medium">{v.vacina.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      Dose {v.dose} · Lote {v.lote}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">{formatDate(v.data_aplicacao)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {membro && (
        <section className="grid gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Stethoscope className="size-5 text-primary" /> Histórico de atendimentos
              <span className="text-sm font-normal text-muted-foreground">({atendimentos.length})</span>
            </h2>
            <VisitDialog animal={animal} prontuario={pront} trigger={<Button size="sm" variant="outline">+ Atendimento</Button>} />
          </div>
          {atendimentos.length === 0 ? (
            <p className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">Nenhum atendimento registrado.</p>
          ) : (
            <ol className="relative grid gap-3 border-l border-border pl-6">
              {atendimentos.map((at) => (
                <li key={at.id} className="relative rounded-2xl bg-muted/60 p-4">
                  <span className="absolute top-5 -left-[29px] size-2.5 rounded-full bg-primary ring-4 ring-card" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary/15 text-primary">{tipoAtendimentoLabel[at.tipo]}</Badge>
                    <span className="text-sm font-medium">{formatDate(at.data)}</span>
                    <span className="text-sm text-muted-foreground">
                      · {at.veterinario.nome} (CRMV {at.veterinario.crmv})
                    </span>
                    {at.peso != null && <span className="ml-auto text-sm text-muted-foreground">{formatPeso(at.peso)}</span>}
                  </div>
                  <p className="mt-2">{at.diagnostico}</p>
                  {at.tratamento && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground/80">Tratamento:</span> {at.tratamento}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  )
}
