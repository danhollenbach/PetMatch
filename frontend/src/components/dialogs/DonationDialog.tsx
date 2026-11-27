import { AsyncForm } from "@/components/AsyncForm"
import { useState, type ReactNode } from "react"
import { Banknote, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Field, MaskedInput, Modal, Segmented, attempt, invalid } from "@/components/common"
import { today } from "@/lib/format"
import { useDb } from "@/store/db"
import type { Doador, TipoDoacao } from "@/types/db"

/**
 * Registra uma DOACAO (dinheiro ou insumos), opcionalmente ligada a um DOADOR.
 * `presencial` = lançada pela equipe do abrigo (permite escolher a data).
 */
export function DonationDialog({
  trigger,
  cnpj,
  presencial,
}: {
  trigger: ReactNode
  cnpj: string
  presencial?: boolean
}) {
  const { db } = useDb()
  const abrigo = db.abrigo.find((a) => a.cnpj === cnpj)
  return (
    <Modal
      trigger={trigger}
      title={presencial ? "Registrar doação presencial" : `Doar para ${abrigo?.nome}`}
      description={
        presencial
          ? "Lance uma doação recebida diretamente no abrigo ou em uma feira."
          : "Toda ajuda faz diferença! Doe um valor ou insumos como ração, remédios e cobertores."
      }
    >
      {(close) => <DonationForm cnpj={cnpj} presencial={presencial} close={close} />}
    </Modal>
  )
}

function DonationForm({ cnpj, presencial, close }: { cnpj: string; presencial?: boolean; close: () => void }) {
  const { db, actions } = useDb()
  const [tipo, setTipo] = useState<TipoDoacao>("dinheiro")
  const [valor, setValor] = useState("")
  const [descricao, setDescricao] = useState("")
  const [data, setData] = useState(today())
  const [identificar, setIdentificar] = useState(false)
  const [doador, setDoador] = useState<Doador>({ documento: "", nome: "", email: "", telefone: "" })
  const [conhecido, setConhecido] = useState(false)

  function onDocumento(documento: string) {
    const existente = db.doador.find((d) => d.documento === documento)
    setConhecido(!!existente)
    setDoador(existente ? { ...existente, email: existente.email ?? "", telefone: existente.telefone ?? "" } : { ...doador, documento })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = Number(valor.replace(",", "."))
    if (tipo === "dinheiro" && !(v > 0)) return invalid("Informe um valor maior que zero.")
    if (tipo === "insumo" && !descricao.trim()) return invalid("Descreva os insumos doados.")
    if (identificar && ![11, 14].includes(doador.documento.length))
      return invalid("O documento do doador deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos).")

    const ok = await attempt(
      () =>
        actions.registrarDoacao(
          {
            cnpj_abrigo: cnpj,
            tipo,
            valor: tipo === "dinheiro" ? v : null,
            descricao: descricao.trim() || null,
            data,
          },
          identificar
            ? { ...doador, nome: doador.nome.trim(), email: doador.email || null, telefone: doador.telefone || null }
            : null
        ),
      presencial ? "Doação registrada." : "Obrigado pela sua doação! 💛"
    )
    if (ok) close()
  }

  return (
    <AsyncForm onSubmit={submit} className="grid gap-4">
      <Segmented
        value={tipo}
        onChange={setTipo}
        className="w-full"
        options={[
          { value: "dinheiro", label: <><Banknote className="size-4" /> Dinheiro</> },
          { value: "insumo", label: <><Package className="size-4" /> Insumos</> },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {tipo === "dinheiro" && (
          <Field label="Valor (R$)" className={presencial ? "" : "sm:col-span-2"}>
            <Input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="50,00" />
          </Field>
        )}
        {presencial && (
          <Field label="Data" className={tipo === "insumo" ? "sm:col-span-2" : ""}>
            <Input type="date" required max={today()} value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
        )}
        <Field label={tipo === "insumo" ? "O que será doado?" : "Mensagem"} optional={tipo === "dinheiro"} className="sm:col-span-2">
          <Textarea
            maxLength={200}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={tipo === "insumo" ? "Ex.: 10 kg de ração para gatos filhotes" : "Deixe um recado para o abrigo"}
          />
        </Field>
      </div>

      <label className="flex items-center justify-between gap-4 rounded-2xl bg-muted/60 px-4 py-3">
        <span>
          <span className="block text-sm font-medium">Identificar doador</span>
          <span className="block text-xs text-muted-foreground">Sem identificação, a doação fica anônima.</span>
        </span>
        <Switch checked={identificar} onCheckedChange={setIdentificar} />
      </label>

      {identificar && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CPF ou CNPJ" hint={conhecido ? "Doador já cadastrado — dados preenchidos." : undefined}>
            <MaskedInput kind="documento" value={doador.documento} onChange={onDocumento} placeholder="Somente números" />
          </Field>
          <Field label="Nome ou razão social">
            <Input required maxLength={120} value={doador.nome} onChange={(e) => setDoador({ ...doador, nome: e.target.value })} />
          </Field>
          <Field label="E-mail" optional>
            <Input type="email" maxLength={120} value={doador.email ?? ""} onChange={(e) => setDoador({ ...doador, email: e.target.value })} />
          </Field>
          <Field label="Telefone" optional>
            <MaskedInput kind="telefone" value={doador.telefone ?? ""} onChange={(v) => setDoador({ ...doador, telefone: v })} />
          </Field>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={close}>
          Cancelar
        </Button>
        <Button type="submit">{presencial ? "Registrar doação" : "Confirmar doação"}</Button>
      </div>
    </AsyncForm>
  )
}
