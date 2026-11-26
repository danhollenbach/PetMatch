import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState, Field, Modal, Segmented, SelectField, attempt, invalid } from "@/components/common"
import { especieLabel, tipoAtendimentoLabel, today } from "@/lib/format"
import { veterinariosDoAbrigo } from "@/lib/queries"
import { useDb } from "@/store/db"
import type { Animal, EspecieAlvo, Prontuario, TipoAtendimento } from "@/types/db"

type Props = { trigger: ReactNode; animal: Animal; prontuario: Prontuario }

/* ------------------------------------------------------------------ */
/* ATENDIMENTO                                                         */
/* ------------------------------------------------------------------ */

export function VisitDialog({ trigger, animal, prontuario }: Props) {
  return (
    <Modal trigger={trigger} title="Novo atendimento" description={`Registro clínico de ${animal.nome}.`} className="sm:max-w-xl">
      {(close) => <VisitForm animal={animal} prontuario={prontuario} close={close} />}
    </Modal>
  )
}

function VisitForm({ animal, prontuario, close }: Omit<Props, "trigger"> & { close: () => void }) {
  const { db, actions } = useDb()
  const vets = veterinariosDoAbrigo(db, animal.cnpj_abrigo)
  const [cpfVet, setCpfVet] = useState(vets.length === 1 ? vets[0].cpf : "")
  const [tipo, setTipo] = useState<TipoAtendimento>("consulta")
  const [data, setData] = useState(today())
  const [peso, setPeso] = useState("")
  const [diagnostico, setDiagnostico] = useState("")
  const [tratamento, setTratamento] = useState("")

  if (vets.length === 0)
    return (
      <EmptyState icon={<Stethoscope className="size-5" />} title="Nenhum veterinário vinculado">
        Vincule um veterinário ao abrigo em{" "}
        <Link to="/painel?aba=equipe" className="text-primary underline" onClick={close}>
          Equipe
        </Link>{" "}
        para registrar atendimentos.
      </EmptyState>
    )

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!cpfVet) return invalid("Selecione o veterinário responsável.")
    const p = peso ? Number(peso.replace(",", ".")) : null
    if (p != null && !(p > 0 && p < 1000)) return invalid("Informe um peso válido (kg).")
    const ok = attempt(
      () =>
        actions.registrarAtendimento({
          cpf_veterinario: cpfVet,
          id_prontuario: prontuario.id,
          tipo,
          data,
          peso: p,
          diagnostico: diagnostico.trim(),
          tratamento: tratamento.trim() || null,
        }),
      "Atendimento registrado."
    )
    if (ok) close()
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Veterinário(a)" className="sm:col-span-2">
        <SelectField
          value={cpfVet}
          onChange={setCpfVet}
          placeholder="Selecione"
          options={vets.map((v) => ({ value: v.cpf, label: `${v.nome} · CRMV ${v.crmv}` }))}
        />
      </Field>
      <Field label="Tipo">
        <SelectField
          value={tipo}
          onChange={setTipo}
          options={(Object.keys(tipoAtendimentoLabel) as TipoAtendimento[]).map((t) => ({ value: t, label: tipoAtendimentoLabel[t] }))}
        />
      </Field>
      <Field label="Data">
        <Input type="date" required max={today()} value={data} onChange={(e) => setData(e.target.value)} />
      </Field>
      <Field label="Diagnóstico" className="sm:col-span-2">
        <Textarea required value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} />
      </Field>
      <Field label="Tratamento" optional className="sm:col-span-2">
        <Textarea value={tratamento} onChange={(e) => setTratamento(e.target.value)} placeholder="Medicação, dosagem, recomendações…" />
      </Field>
      <Field label="Peso aferido (kg)" optional hint="Se informado, atualiza o peso atual do prontuário.">
        <Input inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder={prontuario.peso ? String(prontuario.peso).replace(".", ",") : "Ex.: 12,5"} />
      </Field>
      <div className="flex items-end justify-end gap-2">
        <Button type="button" variant="ghost" onClick={close}>
          Cancelar
        </Button>
        <Button type="submit">Registrar</Button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* APLICACAO (+ VACINA nova, se necessário)                            */
/* ------------------------------------------------------------------ */

export function VaccineDialog({ trigger, animal, prontuario }: Props) {
  return (
    <Modal trigger={trigger} title="Registrar vacina" description={`Aplicação de vacina em ${animal.nome}.`}>
      {(close) => <VaccineForm animal={animal} prontuario={prontuario} close={close} />}
    </Modal>
  )
}

function VaccineForm({ animal, prontuario, close }: Omit<Props, "trigger"> & { close: () => void }) {
  const { db, actions } = useDb()
  const [modo, setModo] = useState<"existente" | "nova">("existente")
  const [idVacina, setIdVacina] = useState("")
  const [novaNome, setNovaNome] = useState("")
  const [novaEspecie, setNovaEspecie] = useState<EspecieAlvo>(animal.especie)
  const [dose, setDose] = useState(1)
  const [data, setData] = useState(today())
  const [lote, setLote] = useState("")

  const vacinas = db.vacina.filter((v) => v.especie_alvo === animal.especie || v.especie_alvo === "ambos")

  function escolherVacina(id: string) {
    setIdVacina(id)
    const doses = db.aplicacao
      .filter((ap) => ap.id_prontuario === prontuario.id && ap.id_vacina === Number(id))
      .map((ap) => ap.dose)
    setDose(Math.max(0, ...doses) + 1)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (modo === "existente" && !idVacina) return invalid("Selecione a vacina.")
    if (dose < 1) return invalid("A dose deve ser 1 ou maior.")
    const ok = attempt(
      () =>
        actions.registrarAplicacao(
          {
            id_prontuario: prontuario.id,
            id_vacina: modo === "existente" ? Number(idVacina) : null,
            dose,
            data_aplicacao: data,
            lote: lote.trim(),
          },
          modo === "nova" ? { nome: novaNome.trim(), especie_alvo: novaEspecie } : undefined
        ),
      "Vacina registrada."
    )
    if (ok) close()
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Segmented
        value={modo}
        onChange={(m) => {
          setModo(m)
          if (m === "nova") setDose(1)
        }}
        className="w-full"
        options={[
          { value: "existente", label: "Vacina do catálogo" },
          { value: "nova", label: "+ Nova vacina" },
        ]}
      />
      {modo === "existente" ? (
        <Field label="Vacina">
          <SelectField
            value={idVacina}
            onChange={escolherVacina}
            options={vacinas.map((v) => ({ value: String(v.id), label: `${v.nome} · ${especieLabel[v.especie_alvo]}` }))}
          />
        </Field>
      ) : (
        <div className="grid gap-4 rounded-2xl bg-muted/60 p-4 sm:grid-cols-2">
          <Field label="Nome da vacina">
            <Input required maxLength={80} value={novaNome} onChange={(e) => setNovaNome(e.target.value)} placeholder="Ex.: FeLV" />
          </Field>
          <Field label="Espécie-alvo">
            <SelectField
              value={novaEspecie}
              onChange={setNovaEspecie}
              options={(Object.keys(especieLabel) as EspecieAlvo[]).map((e) => ({ value: e, label: especieLabel[e] }))}
            />
          </Field>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Dose">
          <Input type="number" min={1} required value={dose} onChange={(e) => setDose(Number(e.target.value))} />
        </Field>
        <Field label="Data">
          <Input type="date" required max={today()} value={data} onChange={(e) => setData(e.target.value)} />
        </Field>
        <Field label="Lote" className="col-span-2 sm:col-span-1">
          <Input required maxLength={30} value={lote} onChange={(e) => setLote(e.target.value)} placeholder="Ex.: V10-2611A" />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={close}>
          Cancelar
        </Button>
        <Button type="submit">Registrar aplicação</Button>
      </div>
    </form>
  )
}
