import { AsyncForm } from "@/components/AsyncForm"
import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Field, MaskedInput, Modal, SelectField, attempt, invalid } from "@/components/common"
import { UFS } from "@/lib/format"
import { useDb } from "@/store/db"
import { useSession } from "@/store/session"
import type { Abrigo, Voluntario } from "@/types/db"

const vazio: Abrigo = { cnpj: "", nome: "", telefone: "", capacidade: 10, logradouro: "", cep: "", uf: "", cidade: "" }

/** Cadastro de ABRIGO (+ voluntário gestor via ATUA) ou edição dos dados do abrigo. */
export function ShelterDialog({ trigger, abrigo }: { trigger: ReactNode; abrigo?: Abrigo }) {
  return (
    <Modal
      trigger={trigger}
      title={abrigo ? "Editar dados do abrigo" : "Cadastrar abrigo"}
      description={
        abrigo
          ? "Atualize as informações públicas do abrigo."
          : "Cadastre seu abrigo na plataforma. Você será registrado como voluntário coordenador e terá acesso ao painel de gestão."
      }
      className="sm:max-w-2xl"
    >
      {(close) => <ShelterForm abrigo={abrigo} close={close} />}
    </Modal>
  )
}

function ShelterForm({ abrigo, close }: { abrigo?: Abrigo; close: () => void }) {
  const { actions } = useDb()
  const { setCnpj } = useSession()
  const navigate = useNavigate()
  const [f, setF] = useState<Abrigo>(abrigo ?? vazio)
  const [gestor, setGestor] = useState<Voluntario>({ cpf: "", nome: "", email: "", telefone: "" })
  const set = <K extends keyof Abrigo>(k: K, v: Abrigo[K]) => setF((s) => ({ ...s, [k]: v }))
  const setG = <K extends keyof Voluntario>(k: K, v: Voluntario[K]) => setGestor((s) => ({ ...s, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (f.cnpj.length !== 14) return invalid("Informe um CNPJ válido com 14 dígitos.")
    if (!f.uf) return invalid("Selecione a UF.")
    if (f.capacidade < 1) return invalid("A capacidade deve ser de pelo menos 1 animal.")
    const dados: Abrigo = { ...f, nome: f.nome.trim(), cep: f.cep || null }

    if (abrigo) {
      if (await attempt(() => actions.atualizarAbrigo(dados), "Dados do abrigo atualizados.")) close()
      return
    }
    if (gestor.cpf.length !== 11) return invalid("Informe o CPF do responsável com 11 dígitos.")
    const ok = await attempt(
      () =>
        actions.registrarAbrigo(dados, {
          ...gestor,
          nome: gestor.nome.trim(),
          email: gestor.email || null,
          telefone: gestor.telefone || null,
        }),
      `${dados.nome} cadastrado! Você agora está no modo abrigo.`
    )
    if (ok) {
      setCnpj(dados.cnpj)
      close()
      navigate("/painel")
    }
  }

  return (
    <AsyncForm onSubmit={submit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome do abrigo" className="sm:col-span-2">
          <Input required maxLength={120} value={f.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: Abrigo Amigos de Quatro Patas" />
        </Field>
        <Field label="CNPJ">
          <MaskedInput kind="cnpj" required disabled={!!abrigo} value={f.cnpj} onChange={(v) => set("cnpj", v)} placeholder="00.000.000/0000-00" />
        </Field>
        <Field label="Telefone">
          <MaskedInput kind="telefone" required value={f.telefone} onChange={(v) => set("telefone", v)} placeholder="(00) 00000-0000" />
        </Field>
        <Field label="Capacidade" hint="Número máximo de animais abrigados ao mesmo tempo.">
          <Input type="number" min={1} required value={f.capacidade} onChange={(e) => set("capacidade", Number(e.target.value))} />
        </Field>
        <Field label="CEP" optional>
          <MaskedInput kind="cep" value={f.cep ?? ""} onChange={(v) => set("cep", v)} placeholder="00000-000" />
        </Field>
        <Field label="Logradouro" className="sm:col-span-2">
          <Input required maxLength={150} value={f.logradouro} onChange={(e) => set("logradouro", e.target.value)} placeholder="Rua, número, bairro" />
        </Field>
        <Field label="Cidade">
          <Input required maxLength={80} value={f.cidade} onChange={(e) => set("cidade", e.target.value)} />
        </Field>
        <Field label="UF">
          <SelectField value={f.uf} onChange={(v) => set("uf", v)} options={UFS.map((u) => ({ value: u, label: u }))} placeholder="UF" />
        </Field>
      </div>

      {!abrigo && (
        <>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="font-medium">Responsável pelo abrigo</p>
              <p className="text-sm text-muted-foreground">Será vinculado como voluntário com a função “Coordenação”.</p>
            </div>
            <Field label="Nome completo">
              <Input required maxLength={120} value={gestor.nome} onChange={(e) => setG("nome", e.target.value)} />
            </Field>
            <Field label="CPF">
              <MaskedInput kind="cpf" required value={gestor.cpf} onChange={(v) => setG("cpf", v)} placeholder="000.000.000-00" />
            </Field>
            <Field label="E-mail" optional>
              <Input type="email" maxLength={120} value={gestor.email ?? ""} onChange={(e) => setG("email", e.target.value)} />
            </Field>
            <Field label="Telefone" optional>
              <MaskedInput kind="telefone" value={gestor.telefone ?? ""} onChange={(v) => setG("telefone", v)} />
            </Field>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={close}>
          Cancelar
        </Button>
        <Button type="submit">{abrigo ? "Salvar alterações" : "Cadastrar abrigo"}</Button>
      </div>
    </AsyncForm>
  )
}
