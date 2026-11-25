import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Field, MaskedInput, Modal, attempt, invalid } from "@/components/common"
import { FUNCOES, today } from "@/lib/format"
import { voluntariosDoAbrigo } from "@/lib/queries"
import { useDb } from "@/store/db"
import type { FeiraAdocao, Veterinario, Voluntario } from "@/types/db"

/* ------------------------------------------------------------------ */
/* VOLUNTARIO + ATUA                                                   */
/* ------------------------------------------------------------------ */

type VoluntarioComFuncao = Voluntario & { funcao: string }

export function VolunteerDialog({ trigger, cnpj, voluntario }: { trigger: ReactNode; cnpj: string; voluntario?: VoluntarioComFuncao }) {
  return (
    <Modal
      trigger={trigger}
      title={voluntario ? "Editar voluntário" : "Adicionar voluntário"}
      description={voluntario ? "Atualize os dados de contato e a função no abrigo." : "Se o CPF já estiver cadastrado na plataforma, os dados são reaproveitados."}
    >
      {(close) => <VolunteerForm cnpj={cnpj} voluntario={voluntario} close={close} />}
    </Modal>
  )
}

function VolunteerForm({ cnpj, voluntario, close }: { cnpj: string; voluntario?: VoluntarioComFuncao; close: () => void }) {
  const { db, actions } = useDb()
  const [v, setV] = useState<Voluntario>(
    voluntario
      ? { cpf: voluntario.cpf, nome: voluntario.nome, email: voluntario.email ?? "", telefone: voluntario.telefone ?? "" }
      : { cpf: "", nome: "", email: "", telefone: "" }
  )
  const [funcao, setFuncao] = useState(voluntario?.funcao ?? "")
  const [aviso, setAviso] = useState<string>()

  function onCpf(cpf: string) {
    const existente = db.voluntario.find((x) => x.cpf === cpf)
    const jaAtua = db.atua.some((a) => a.cnpj_abrigo === cnpj && a.cpf_voluntario === cpf)
    setAviso(jaAtua ? "Este voluntário já faz parte da equipe." : existente ? "Voluntário já cadastrado na plataforma — dados preenchidos." : undefined)
    setV(existente ? { ...existente, email: existente.email ?? "", telefone: existente.telefone ?? "" } : { ...v, cpf })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (v.cpf.length !== 11) return invalid("Informe um CPF com 11 dígitos.")
    if (!voluntario && db.atua.some((a) => a.cnpj_abrigo === cnpj && a.cpf_voluntario === v.cpf))
      return invalid("Este voluntário já faz parte da equipe. Edite-o pela lista.")
    if (!funcao.trim()) return invalid("Informe a função.")
    const ok = attempt(
      () =>
        actions.salvarVoluntario(
          cnpj,
          { ...v, nome: v.nome.trim(), email: v.email || null, telefone: v.telefone || null },
          funcao.trim()
        ),
      voluntario ? "Voluntário atualizado." : `${v.nome} entrou para a equipe!`
    )
    if (ok) close()
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="CPF" hint={aviso}>
        <MaskedInput kind="cpf" required disabled={!!voluntario} value={v.cpf} onChange={onCpf} placeholder="000.000.000-00" />
      </Field>
      <Field label="Nome">
        <Input required maxLength={120} value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} />
      </Field>
      <Field label="E-mail" optional>
        <Input type="email" maxLength={120} value={v.email ?? ""} onChange={(e) => setV({ ...v, email: e.target.value })} />
      </Field>
      <Field label="Telefone" optional>
        <MaskedInput kind="telefone" value={v.telefone ?? ""} onChange={(t) => setV({ ...v, telefone: t })} />
      </Field>
      <Field label="Função no abrigo" className="sm:col-span-2">
        <Input required maxLength={30} list="funcoes" value={funcao} onChange={(e) => setFuncao(e.target.value)} placeholder="Escolha ou digite" />
        <datalist id="funcoes">
          {FUNCOES.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={close}>
          Cancelar
        </Button>
        <Button type="submit">{voluntario ? "Salvar" : "Adicionar"}</Button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* VETERINARIO + VINCULO                                               */
/* ------------------------------------------------------------------ */

export function VetDialog({ trigger, cnpj, vet }: { trigger: ReactNode; cnpj: string; vet?: Veterinario }) {
  return (
    <Modal
      trigger={trigger}
      title={vet ? "Editar veterinário" : "Vincular veterinário"}
      description={vet ? "Atualize os dados do profissional." : "Informe o CPF: se o profissional já atende outro abrigo, basta vinculá-lo."}
    >
      {(close) => <VetForm cnpj={cnpj} vet={vet} close={close} />}
    </Modal>
  )
}

function VetForm({ cnpj, vet, close }: { cnpj: string; vet?: Veterinario; close: () => void }) {
  const { db, actions } = useDb()
  const [v, setV] = useState<Veterinario>(
    vet ? { ...vet, email: vet.email ?? "", telefone: vet.telefone ?? "" } : { cpf: "", nome: "", email: "", telefone: "", crmv: "" }
  )
  const [aviso, setAviso] = useState<string>()

  function onCpf(cpf: string) {
    const existente = db.veterinario.find((x) => x.cpf === cpf)
    const vinculado = db.vinculo.some((x) => x.cnpj_abrigo === cnpj && x.cpf_veterinario === cpf)
    setAviso(vinculado ? "Já vinculado a este abrigo." : existente ? "Profissional já cadastrado — dados preenchidos." : undefined)
    setV(existente ? { ...existente, email: existente.email ?? "", telefone: existente.telefone ?? "" } : { ...v, cpf })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (v.cpf.length !== 11) return invalid("Informe um CPF com 11 dígitos.")
    if (!vet && db.vinculo.some((x) => x.cnpj_abrigo === cnpj && x.cpf_veterinario === v.cpf))
      return invalid("Este veterinário já está vinculado ao abrigo.")
    const ok = attempt(
      () =>
        actions.salvarVeterinario(cnpj, {
          ...v,
          nome: v.nome.trim(),
          crmv: v.crmv.trim().toUpperCase(),
          email: v.email || null,
          telefone: v.telefone || null,
        }),
      vet ? "Veterinário atualizado." : `${v.nome} vinculado(a) ao abrigo.`
    )
    if (ok) close()
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="CPF" hint={aviso}>
        <MaskedInput kind="cpf" required disabled={!!vet} value={v.cpf} onChange={onCpf} placeholder="000.000.000-00" />
      </Field>
      <Field label="CRMV">
        <Input required maxLength={20} value={v.crmv} onChange={(e) => setV({ ...v, crmv: e.target.value })} placeholder="UF-00000" />
      </Field>
      <Field label="Nome" className="sm:col-span-2">
        <Input required maxLength={120} value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} placeholder="Dra. Maria Souza" />
      </Field>
      <Field label="E-mail" optional>
        <Input type="email" maxLength={120} value={v.email ?? ""} onChange={(e) => setV({ ...v, email: e.target.value })} />
      </Field>
      <Field label="Telefone" optional>
        <MaskedInput kind="telefone" value={v.telefone ?? ""} onChange={(t) => setV({ ...v, telefone: t })} />
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={close}>
          Cancelar
        </Button>
        <Button type="submit">{vet ? "Salvar" : "Vincular"}</Button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* FEIRA_ADOCAO + PARTICIPA                                            */
/* ------------------------------------------------------------------ */

type FeiraComParticipantes = FeiraAdocao & { participantes: Voluntario[] }

export function FairDialog({
  trigger,
  cnpj,
  feira,
  somenteEquipe,
}: {
  trigger: ReactNode
  cnpj: string
  feira?: FeiraComParticipantes
  /** Abre apenas a seleção de voluntários participantes. */
  somenteEquipe?: boolean
}) {
  return (
    <Modal
      trigger={trigger}
      title={somenteEquipe ? "Voluntários na feira" : feira ? "Editar feira" : "Nova feira de adoção"}
      description={somenteEquipe ? feira?.nome : "Defina local, data e quem da equipe vai participar."}
    >
      {(close) => <FairForm cnpj={cnpj} feira={feira} somenteEquipe={somenteEquipe} close={close} />}
    </Modal>
  )
}

function FairForm({
  cnpj,
  feira,
  somenteEquipe,
  close,
}: {
  cnpj: string
  feira?: FeiraComParticipantes
  somenteEquipe?: boolean
  close: () => void
}) {
  const { db, actions } = useDb()
  const equipe = voluntariosDoAbrigo(db, cnpj)
  const [f, setF] = useState({ nome: feira?.nome ?? "", logradouro: feira?.logradouro ?? "", data: feira?.data ?? today() })
  const [sel, setSel] = useState<Set<string>>(new Set(feira?.participantes.map((p) => p.cpf)))

  const toggle = (cpf: string) =>
    setSel((s) => {
      const n = new Set(s)
      if (n.has(cpf)) n.delete(cpf)
      else n.add(cpf)
      return n
    })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const ok = attempt(
      () => actions.salvarFeira({ ...f, id: feira?.id, cnpj_abrigo: cnpj, nome: f.nome.trim(), logradouro: f.logradouro.trim() }, [...sel]),
      feira ? "Feira atualizada." : "Feira criada!"
    )
    if (ok) close()
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {!somenteEquipe && (
        <>
          <Field label="Nome do evento">
            <Input required maxLength={120} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex.: Feira de Adoção de Natal" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field label="Local (logradouro)">
              <Input required maxLength={150} value={f.logradouro} onChange={(e) => setF({ ...f, logradouro: e.target.value })} />
            </Field>
            <Field label="Data">
              <Input type="date" required value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} />
            </Field>
          </div>
        </>
      )}
      <div className="grid gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">
          Voluntários participantes <span className="opacity-60">({sel.size} selecionados)</span>
        </p>
        {equipe.length === 0 ? (
          <p className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">Nenhum voluntário na equipe ainda.</p>
        ) : (
          <div className="grid max-h-64 gap-1 overflow-y-auto rounded-2xl bg-muted/40 p-1.5">
            {equipe.map((v) => (
              <label key={v.cpf} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted">
                <Checkbox checked={sel.has(v.cpf)} onCheckedChange={() => toggle(v.cpf)} />
                <span className="flex-1 text-sm">{v.nome}</span>
                <span className="text-xs text-muted-foreground">{v.funcao}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={close}>
          Cancelar
        </Button>
        <Button type="submit">{feira ? "Salvar" : "Criar feira"}</Button>
      </div>
    </form>
  )
}
