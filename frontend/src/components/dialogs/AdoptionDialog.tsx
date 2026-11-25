import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, MaskedInput, Modal, attempt, invalid } from "@/components/common"
import { useDb } from "@/store/db"
import type { Adotante, Animal } from "@/types/db"

/** Público: cria/atualiza o ADOTANTE e abre um PEDIDO_ADOCAO. */
export function AdoptionDialog({ trigger, animal }: { trigger: ReactNode; animal: Animal }) {
  return (
    <Modal
      trigger={trigger}
      title={`Quero adotar ${animal.nome}!`}
      description="Preencha seus dados. O abrigo vai analisar o pedido e entrar em contato com você."
    >
      {(close) => <AdoptionForm animal={animal} close={close} />}
    </Modal>
  )
}

function AdoptionForm({ animal, close }: { animal: Animal; close: () => void }) {
  const { db, actions } = useDb()
  const [f, setF] = useState<Adotante>({ cpf: "", nome: "", email: "", telefone: "" })
  const [conhecido, setConhecido] = useState(false)

  function onCpf(cpf: string) {
    const existente = db.adotante.find((a) => a.cpf === cpf)
    setConhecido(!!existente)
    setF(existente ?? { ...f, cpf })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (f.cpf.length !== 11) return invalid("Informe um CPF com 11 dígitos.")
    if (f.telefone.length < 10) return invalid("Informe um telefone com DDD.")
    const ok = attempt(
      () => actions.solicitarAdocao({ ...f, nome: f.nome.trim(), email: f.email.trim() }, animal.id),
      `Pedido enviado! Boa sorte com ${animal.nome} 🐾`
    )
    if (ok) close()
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="CPF" hint={conhecido ? "Encontramos seu cadastro — confira seus dados." : undefined}>
        <MaskedInput kind="cpf" required value={f.cpf} onChange={onCpf} placeholder="000.000.000-00" />
      </Field>
      <Field label="Nome completo">
        <Input required maxLength={120} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-mail">
          <Input type="email" required maxLength={120} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </Field>
        <Field label="Telefone">
          <MaskedInput kind="telefone" required value={f.telefone} onChange={(v) => setF({ ...f, telefone: v })} placeholder="(00) 00000-0000" />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={close}>
          Cancelar
        </Button>
        <Button type="submit">Enviar pedido</Button>
      </div>
    </form>
  )
}
