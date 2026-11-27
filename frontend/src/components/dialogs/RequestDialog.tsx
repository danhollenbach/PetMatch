import { useRef, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Check, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimalArt, Info, Modal, StatusAnimalBadge, StatusPedidoBadge, attempt } from "@/components/common"
import { applyMask, especieLabel, formatDate, idade, sexoLabel } from "@/lib/format"
import type { PedidoCompleto } from "@/lib/queries"
import { useDb } from "@/store/db"

/** Revisão de PEDIDO_ADOCAO: ANIMAL + ADOTANTE completos e decisão. */
export function RequestDialog({ trigger, pedido }: { trigger: ReactNode; pedido: PedidoCompleto }) {
  return (
    <Modal trigger={trigger} title={`Pedido #${pedido.id}`} description={`Recebido em ${formatDate(pedido.data_pedido)}`} className="sm:max-w-2xl">
      {(close) => <RequestBody pedido={pedido} close={close} />}
    </Modal>
  )
}

function RequestBody({ pedido, close }: { pedido: PedidoCompleto; close: () => void }) {
  const { db, actions } = useDb()
  const { animal, adotante } = pedido
  const concorrentes = db.pedido_adocao.filter(
    (p) => p.id_animal === animal.id && p.id !== pedido.id && p.status === "pendente"
  ).length
  const outrosDoAdotante = db.pedido_adocao.filter((p) => p.cpf_adotante === adotante.cpf && p.id !== pedido.id).length

  const lock = useRef(false)
  const [pending, setPending] = useState(false)

  async function decidir(decisao: "aprovado" | "reprovado") {
    if (lock.current) return
    lock.current = true; setPending(true)
    if (await attempt(() => actions.decidirPedido(pedido.id, decisao), decisao === "aprovado" ? `Adoção de ${animal.nome} aprovada! 🎉` : "Pedido reprovado."))
      close()
    lock.current = false; setPending(false)
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <StatusPedidoBadge status={pedido.status} />
        {pedido.data_decisao && <span className="text-sm text-muted-foreground">· decidido em {formatDate(pedido.data_decisao)}</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="grid content-start gap-3 rounded-3xl bg-card p-4 ring-1 ring-foreground/5">
          <div className="flex items-center gap-3">
            <AnimalArt especie={animal.especie} seed={animal.id} className="size-14 shrink-0" iconClassName="size-7" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Animal</p>
              <p className="truncate text-lg font-semibold">{animal.nome}</p>
            </div>
            <Button asChild variant="ghost" size="icon-sm" className="ml-auto" title="Abrir perfil">
              <Link to={`/animais/${animal.id}`} onClick={close}>
                <ExternalLink />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Info label="Espécie">{especieLabel[animal.especie]}</Info>
            <Info label="Raça">{animal.raca}</Info>
            <Info label="Sexo">{sexoLabel(animal.sexo)}</Info>
            <Info label="Idade">{idade(animal.data_nascimento)}</Info>
            <Info label="Castrado">{animal.castrado ? "Sim" : "Não"}</Info>
            <Info label="Status">
              <StatusAnimalBadge status={animal.status} />
            </Info>
          </div>
        </section>

        <section className="grid content-start gap-3 rounded-3xl bg-card p-4 ring-1 ring-foreground/5">
          <div>
            <p className="text-xs text-muted-foreground">Adotante</p>
            <p className="text-lg font-semibold">{adotante.nome}</p>
          </div>
          <div className="grid gap-2">
            <Info label="CPF">{applyMask("cpf", adotante.cpf)}</Info>
            <Info label="E-mail">
              <a href={`mailto:${adotante.email}`} className="text-primary hover:underline">
                {adotante.email}
              </a>
            </Info>
            <Info label="Telefone">{applyMask("telefone", adotante.telefone)}</Info>
            <Info label="Histórico">
              {outrosDoAdotante === 0 ? "Primeiro pedido na plataforma" : `${outrosDoAdotante} outro(s) pedido(s) na plataforma`}
            </Info>
          </div>
        </section>
      </div>

      {pedido.status === "pendente" && (
        <>
          {concorrentes > 0 && (
            <p className="rounded-2xl bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
              Há mais {concorrentes} pedido(s) pendente(s) para {animal.nome}. Ao aprovar este, os demais serão reprovados automaticamente.
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button disabled={pending} variant="destructive" onClick={() => decidir("reprovado")}>
              <X /> Reprovar
            </Button>
            <Button disabled={pending} onClick={() => decidir("aprovado")}>
              <Check /> Aprovar adoção
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
