import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarHeart, ChevronRight, HandCoins, HandHeart, Inbox, Package, PawPrint, Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AnimalArt, EmptyState, Segmented, StatusAnimalBadge } from "@/components/common"
import { AnimalDialog } from "@/components/dialogs/AnimalDialog"
import { DonationDialog } from "@/components/dialogs/DonationDialog"
import { formatBRL, formatDate, idade, today } from "@/lib/format"
import { abrigoPorCnpj, doacoesDoAbrigo, feirasDoAbrigo, ocupacao, pedidosDoAbrigo } from "@/lib/queries"
import { cn } from "@/lib/utils"
import { useDb } from "@/store/db"
import type { StatusAnimal } from "@/types/db"

type Aba = "geral" | "pedidos" | "equipe" | "feiras"

export function OverviewTab({ cnpj, irPara }: { cnpj: string; irPara: (a: Aba) => void }) {
  const { db } = useDb()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState<"abrigados" | StatusAnimal>("abrigados")

  const abrigo = abrigoPorCnpj(db, cnpj)!
  const ocup = ocupacao(db, cnpj)
  const lotado = ocup >= abrigo.capacidade
  const pendentes = pedidosDoAbrigo(db, cnpj).filter((p) => p.status === "pendente").length
  const doacoes = doacoesDoAbrigo(db, cnpj)
  const arrecadado = doacoes.reduce((s, d) => s + (d.valor ?? 0), 0)
  const insumos = doacoes.filter((d) => d.tipo === "insumo").length
  const proximaFeira = feirasDoAbrigo(db, cnpj).find((f) => f.data >= today())

  const animais = db.animal
    .filter((a) => a.cnpj_abrigo === cnpj)
    .filter((a) => (filtro === "abrigados" ? a.status !== "adotado" : a.status === filtro))
    .sort((a, b) => a.nome.localeCompare(b.nome))

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<PawPrint />} label="Ocupação">
          <p className="text-3xl font-semibold">
            {ocup}
            <span className="text-base font-normal text-muted-foreground"> / {abrigo.capacidade}</span>
          </p>
          <Progress value={(ocup / abrigo.capacidade) * 100} className="mt-2" />
          <p className={cn("mt-1.5 text-xs", lotado ? "text-destructive" : "text-muted-foreground")}>
            {lotado ? "Abrigo lotado" : `${abrigo.capacidade - ocup} vagas livres`}
          </p>
        </Stat>
        <Stat icon={<Inbox />} label="Pedidos pendentes" onClick={() => irPara("pedidos")}>
          <p className="text-3xl font-semibold">{pendentes}</p>
          <p className="mt-1.5 flex items-center text-xs text-primary">
            Revisar pedidos <ChevronRight className="size-3.5" />
          </p>
        </Stat>
        <Stat icon={<HandCoins />} label="Arrecadado em dinheiro">
          <p className="text-3xl font-semibold">{formatBRL(arrecadado)}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">+ {insumos} doações de insumos</p>
        </Stat>
        <Stat icon={<CalendarHeart />} label="Próxima feira" onClick={() => irPara("feiras")}>
          {proximaFeira ? (
            <>
              <p className="text-3xl font-semibold">{formatDate(proximaFeira.data).slice(0, 5)}</p>
              <p className="mt-1.5 truncate text-xs text-muted-foreground">{proximaFeira.nome}</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-semibold">—</p>
              <p className="mt-1.5 text-xs text-primary">Agendar uma feira</p>
            </>
          )}
        </Stat>
      </div>

      <div className="flex flex-wrap gap-2">
        {lotado ? (
          <Button disabled title="O abrigo atingiu a capacidade máxima">
            <Plus /> Cadastrar animal (lotado)
          </Button>
        ) : (
          <AnimalDialog cnpj={cnpj} trigger={<Button><Plus /> Cadastrar animal</Button>} />
        )}
        <DonationDialog cnpj={cnpj} presencial trigger={<Button variant="secondary"><HandHeart /> Doação presencial</Button>} />
        <Button variant="secondary" onClick={() => irPara("pedidos")}>
          <Inbox /> Pedidos de adoção
        </Button>
        <Button variant="secondary" onClick={() => irPara("equipe")}>
          Equipe e feiras <ChevronRight />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section className="grid content-start gap-4 rounded-3xl bg-card p-4 ring-1 ring-foreground/5 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Animais</h2>
            <Segmented
              value={filtro}
              onChange={setFiltro}
              className="text-xs"
              options={[
                { value: "abrigados", label: "No abrigo" },
                { value: "disponivel", label: "Disponíveis" },
                { value: "em_tratamento", label: "Tratamento" },
                { value: "adotado", label: "Adotados" },
              ]}
            />
          </div>
          {animais.length === 0 ? (
            <EmptyState icon={<PawPrint className="size-5" />} title="Nenhum animal nesta categoria" />
          ) : (
            <ul className="grid gap-1.5">
              {animais.map((a) => (
                <li key={a.id}>
                  <div
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(`/animais/${a.id}`)}
                    onKeyDown={(e) => e.key === "Enter" && navigate(`/animais/${a.id}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-muted/70"
                  >
                    <AnimalArt especie={a.especie} seed={a.id} className="size-11 shrink-0 rounded-xl" iconClassName="size-5" />
                    <div className="grid min-w-0 flex-1">
                      <span className="truncate font-medium">{a.nome}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {a.raca} · {a.sexo === "M" ? "Macho" : "Fêmea"} · {idade(a.data_nascimento)}
                      </span>
                    </div>
                    <StatusAnimalBadge status={a.status} />
                    {/* eventos do diálogo (portal) borbulham pela árvore React: não deixar chegar na linha */}
                    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <AnimalDialog cnpj={cnpj} animal={a} trigger={<Button variant="ghost" size="icon-sm" aria-label={`Editar ${a.nome}`}><Pencil /></Button>} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grid content-start gap-4 rounded-3xl bg-card p-4 ring-1 ring-foreground/5 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Doações recebidas</h2>
            <span className="text-sm text-muted-foreground">{doacoes.length}</span>
          </div>
          {doacoes.length === 0 ? (
            <EmptyState icon={<HandHeart className="size-5" />} title="Nenhuma doação ainda" />
          ) : (
            <ul className="grid gap-1.5">
              {doacoes.map((d) => (
                <li key={d.id} className="flex items-start gap-3 rounded-2xl bg-muted/50 p-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    {d.tipo === "dinheiro" ? <HandCoins className="size-4" /> : <Package className="size-4" />}
                  </span>
                  <div className="grid min-w-0 flex-1">
                    <span className="font-medium">{d.tipo === "dinheiro" ? formatBRL(d.valor ?? 0) : d.descricao}</span>
                    {d.tipo === "dinheiro" && d.descricao && <span className="text-xs text-muted-foreground">“{d.descricao}”</span>}
                    <span className="truncate text-xs text-muted-foreground">
                      {d.doador ? d.doador.nome : "Doador anônimo"}
                      {d.doador?.email && ` · ${d.doador.email}`}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(d.data)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ icon, label, children, onClick }: { icon: ReactNode; label: string; children: ReactNode; onClick?: () => void }) {
  const Comp = onClick ? "button" : "div"
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "grid content-start rounded-3xl bg-card p-5 text-left ring-1 ring-foreground/5",
        onClick && "transition-colors hover:ring-primary/40"
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="grid size-8 place-items-center rounded-xl bg-primary/15 text-primary [&_svg]:size-4">{icon}</span>
        {label}
      </div>
      {children}
    </Comp>
  )
}
