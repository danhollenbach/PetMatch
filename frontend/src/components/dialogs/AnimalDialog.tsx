import { AsyncForm } from "@/components/AsyncForm"
import { useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Cat, Dog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Field, Modal, Segmented, SelectField, attempt, invalid } from "@/components/common"
import { statusAnimalLabel, today } from "@/lib/format"
import { abrigoPorCnpj, ocupacao, prontuarioDoAnimal } from "@/lib/queries"
import { useDb } from "@/store/db"
import type { Animal, Prontuario, StatusAnimal } from "@/types/db"

type AnimalForm = Omit<Animal, "id">
type ProntuarioForm = { data_abertura: string; alergias: string; observacoes: string; peso: string }

/** Cadastro/edição de ANIMAL junto com o seu PRONTUARIO (1:1). */
export function AnimalDialog({ trigger, cnpj, animal }: { trigger: ReactNode; cnpj: string; animal?: Animal }) {
  return (
    <Modal
      trigger={trigger}
      title={animal ? `Editar ${animal.nome}` : "Cadastrar animal"}
      description={animal ? "Dados do animal e do prontuário médico." : "O prontuário médico é aberto junto com o cadastro."}
      className="sm:max-w-2xl"
    >
      {(close) => <AnimalFormBody cnpj={cnpj} animal={animal} close={close} />}
    </Modal>
  )
}

function AnimalFormBody({ cnpj, animal, close }: { cnpj: string; animal?: Animal; close: () => void }) {
  const { db, actions } = useDb()
  const navigate = useNavigate()
  const pront = animal ? prontuarioDoAnimal(db, animal.id) : undefined
  const abrigo = abrigoPorCnpj(db, cnpj)!
  const ocup = ocupacao(db, cnpj)

  const [a, setA] = useState<AnimalForm>(
    animal ?? {
      cnpj_abrigo: cnpj,
      nome: "",
      especie: "cachorro",
      sexo: "M",
      raca: "",
      data_nascimento: null,
      status: "disponivel",
      castrado: false,
    }
  )
  const [p, setP] = useState<ProntuarioForm>({
    data_abertura: pront?.data_abertura ?? today(),
    alergias: pront?.alergias ?? "",
    observacoes: pront?.observacoes ?? "",
    peso: pront?.peso != null ? String(pront.peso).replace(".", ",") : "",
  })
  const setAnimal = <K extends keyof AnimalForm>(k: K, v: AnimalForm[K]) => setA((s) => ({ ...s, [k]: v }))
  const setPront = <K extends keyof ProntuarioForm>(k: K, v: ProntuarioForm[K]) => setP((s) => ({ ...s, [k]: v }))

  const racas = useMemo(
    () => [...new Set(db.animal.filter((x) => x.especie === a.especie).map((x) => x.raca))].sort(),
    [db.animal, a.especie]
  )

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const peso = p.peso ? Number(p.peso.replace(",", ".")) : null
    if (peso != null && !(peso > 0 && peso < 1000)) return invalid("Informe um peso válido (kg).")
    const prontuario: Omit<Prontuario, "id" | "id_animal"> = {
      data_abertura: p.data_abertura,
      alergias: p.alergias.trim() || null,
      observacoes: p.observacoes.trim() || null,
      peso,
    }
    let id = animal?.id
    const ok = await attempt(
      async () => {
        id = await actions.salvarAnimal({ ...a, id: animal?.id, nome: a.nome.trim(), raca: a.raca.trim() }, prontuario)
      },
      animal ? "Cadastro atualizado." : `${a.nome} foi cadastrado(a)!`
    )
    if (ok) {
      close()
      if (!animal) navigate(`/animais/${id}`)
    }
  }

  const statusOptions = (Object.keys(statusAnimalLabel) as StatusAnimal[]).map((s) => ({ value: s, label: statusAnimalLabel[s] }))

  return (
    <AsyncForm onSubmit={submit} className="grid gap-5">
      {!animal && (
        <div className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Ocupação do abrigo</span>
          <span className={ocup >= abrigo.capacidade ? "font-semibold text-destructive" : "font-semibold"}>
            {ocup} / {abrigo.capacidade}
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" className="sm:col-span-2">
          <Input required maxLength={60} value={a.nome} onChange={(e) => setAnimal("nome", e.target.value)} />
        </Field>
        <Field label="Espécie">
          <Segmented
            value={a.especie}
            onChange={(v) => setAnimal("especie", v)}
            className="w-full"
            options={[
              { value: "cachorro", label: <><Dog className="size-4" /> Cachorro</> },
              { value: "gato", label: <><Cat className="size-4" /> Gato</> },
            ]}
          />
        </Field>
        <Field label="Sexo">
          <Segmented
            value={a.sexo}
            onChange={(v) => setAnimal("sexo", v)}
            className="w-full"
            options={[
              { value: "M", label: "Macho" },
              { value: "F", label: "Fêmea" },
            ]}
          />
        </Field>
        <Field label="Raça" hint="Use “SRD” para sem raça definida.">
          <Input required maxLength={60} list="racas" value={a.raca} onChange={(e) => setAnimal("raca", e.target.value)} />
          <datalist id="racas">
            {racas.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </Field>
        <Field label="Data de nascimento" optional>
          <Input type="date" max={today()} value={a.data_nascimento ?? ""} onChange={(e) => setAnimal("data_nascimento", e.target.value || null)} />
        </Field>
        <Field label="Status">
          <SelectField value={a.status} onChange={(v) => setAnimal("status", v)} options={statusOptions} />
        </Field>
        <label className="flex items-center justify-between gap-4 self-end rounded-2xl bg-muted/60 px-4 py-2">
          <span className="text-sm font-medium">Castrado(a)</span>
          <Switch checked={a.castrado} onCheckedChange={(v) => setAnimal("castrado", v)} />
        </label>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <p className="font-medium sm:col-span-2">Prontuário</p>
        <Field label="Data de abertura">
          <Input type="date" required max={today()} value={p.data_abertura} onChange={(e) => setPront("data_abertura", e.target.value)} />
        </Field>
        <Field label="Peso (kg)" optional>
          <Input inputMode="decimal" value={p.peso} onChange={(e) => setPront("peso", e.target.value)} placeholder="Ex.: 12,5" />
        </Field>
        <Field label="Alergias" optional className="sm:col-span-2">
          <Input maxLength={200} value={p.alergias} onChange={(e) => setPront("alergias", e.target.value)} placeholder="Nenhuma conhecida" />
        </Field>
        <Field label="Observações" optional className="sm:col-span-2">
          <Textarea value={p.observacoes} onChange={(e) => setPront("observacoes", e.target.value)} placeholder="Temperamento, cuidados especiais, histórico do resgate…" />
        </Field>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={close}>
          Cancelar
        </Button>
        <Button type="submit">{animal ? "Salvar alterações" : "Cadastrar animal"}</Button>
      </div>
    </AsyncForm>
  )
}
