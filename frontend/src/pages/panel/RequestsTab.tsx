import { useState } from "react"
import { Inbox } from "lucide-react"
import { AnimalArt, EmptyState, Segmented, StatusPedidoBadge } from "@/components/common"
import { RequestDialog } from "@/components/dialogs/RequestDialog"
import { formatDate } from "@/lib/format"
import { pedidosDoAbrigo } from "@/lib/queries"
import { useDb } from "@/store/db"
import type { StatusPedido } from "@/types/db"

export function RequestsTab({ cnpj }: { cnpj: string }) {
  const { db } = useDb()
  const [filtro, setFiltro] = useState<StatusPedido | "todos">("pendente")
  const pedidos = pedidosDoAbrigo(db, cnpj)
  const count = (s: StatusPedido) => pedidos.filter((p) => p.status === s).length
  const lista = filtro === "todos" ? pedidos : pedidos.filter((p) => p.status === filtro)

  return (
    <div className="grid gap-5">
      <Segmented
        value={filtro}
        onChange={setFiltro}
        className="w-fit max-w-full overflow-x-auto"
        options={[
          { value: "pendente", label: `Pendentes (${count("pendente")})` },
          { value: "aprovado", label: `Aprovados (${count("aprovado")})` },
          { value: "reprovado", label: `Reprovados (${count("reprovado")})` },
          { value: "todos", label: `Todos (${pedidos.length})` },
        ]}
      />

      {lista.length === 0 ? (
        <EmptyState icon={<Inbox className="size-5" />} title="Nenhum pedido aqui">
          {filtro === "pendente" ? "Tudo em dia! Novos pedidos aparecerão nesta fila." : "Não há pedidos com este status."}
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((p) => (
            <RequestDialog
              key={p.id}
              pedido={p}
              trigger={
                <button className="flex items-center gap-3 rounded-3xl bg-card p-3 text-left ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:ring-primary/40">
                  <AnimalArt especie={p.animal.especie} seed={p.animal.id} className="size-14 shrink-0" iconClassName="size-7" />
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate font-semibold">{p.animal.nome}</span>
                    <span className="truncate text-sm text-muted-foreground">{p.adotante.nome}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(p.data_pedido)}</span>
                  </div>
                  <StatusPedidoBadge status={p.status} />
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
