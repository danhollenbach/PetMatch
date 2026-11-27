import { Children, cloneElement, isValidElement, useId, useRef, useState, type ReactNode } from "react"
import { Cat, Dog } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { applyMask, maxDigits, onlyDigits, statusAnimalLabel, statusPedidoLabel, type MaskKind } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Especie, StatusAnimal, StatusPedido } from "@/types/db"

/* ------------------------------------------------------------------ */
/* Modal: o trigger abre; o conteúdo é montado a cada abertura, então  */
/* o estado do formulário sempre começa limpo.                         */
/* ------------------------------------------------------------------ */

export function Modal({
  trigger,
  title,
  description,
  className,
  children,
}: {
  trigger: ReactNode
  title: ReactNode
  description?: ReactNode
  className?: string
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn("max-h-[92vh] overflow-y-auto sm:max-w-lg", className)}>
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  )
}

export function Confirm({
  trigger,
  title,
  description,
  confirmLabel = "Confirmar",
  onConfirm,
}: {
  trigger: ReactNode
  title: string
  description: ReactNode
  confirmLabel?: string
  onConfirm: () => boolean | Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const lock = useRef(false)
  return (
    <AlertDialog open={open} onOpenChange={(value) => { if (!lock.current) setOpen(value) }}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={async (event) => {
            event.preventDefault()
            if (lock.current) return
            lock.current = true; setPending(true)
            try { if (await onConfirm()) setOpen(false) }
            catch (error) { toast.error(error instanceof Error ? error.message : "Falha na operação.") }
            finally { lock.current = false; setPending(false) }
          }}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Validação de formulário: mostra a mensagem e interrompe o submit. */
export function invalid(msg: string) {
  toast.error(msg)
}

/** Executa uma ação do banco; mostra o erro de restrição em um toast. Retorna true se deu certo. */
export async function attempt(fn: () => unknown | Promise<unknown>, sucesso?: string) {
  try {
    await fn()
    if (sucesso) toast.success(sucesso)
    return true
  } catch (e) {
    if (e instanceof Error) {
      toast.error(e.message)
      return false
    }
    throw e
  }
}

/* ------------------------------------------------------------------ */
/* Campos de formulário                                                */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  optional,
  className,
  children,
}: {
  label: string
  hint?: ReactNode
  optional?: boolean
  className?: string
  children: ReactNode
}) {
  // associa o rótulo ao primeiro controle (inputs, selects e textareas repassam o id)
  const autoId = useId()
  const first = Children.toArray(children)[0]
  const id = isValidElement<{ id?: string }>(first) ? (first.props.id ?? autoId) : undefined
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className="text-[13px] text-muted-foreground">
        {label}
        {optional && <span className="font-normal opacity-60">(opcional)</span>}
      </Label>
      {Children.map(children, (c, i) => (i === 0 && isValidElement<{ id?: string }>(c) ? cloneElement(c, { id }) : c))}
      {hint && <p className="px-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** Input que exibe a máscara mas entrega apenas os dígitos (como o banco armazena). */
export function MaskedInput({
  kind,
  value,
  onChange,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  kind: MaskKind
  value: string
  onChange: (digits: string) => void
}) {
  return (
    <Input
      inputMode="numeric"
      value={applyMask(kind, value)}
      onChange={(e) => onChange(onlyDigits(e.target.value).slice(0, maxDigits[kind]))}
      {...props}
    />
  )
}

export function SelectField<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Selecione",
  className,
  id,
}: {
  id?: string
  value: T | ""
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  placeholder?: string
  className?: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger id={id} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Alternador em pílulas (segmented button do Material). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  className?: string
}) {
  return (
    <div className={cn("inline-flex rounded-full bg-muted p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
            value === o.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Apresentação                                                        */
/* ------------------------------------------------------------------ */

const statusAnimalStyle: Record<StatusAnimal, string> = {
  disponivel: "bg-primary/15 text-primary",
  em_tratamento: "bg-amber-400/15 text-amber-300",
  reservado: "bg-sky-400/15 text-sky-300",
  adotado: "bg-foreground/10 text-muted-foreground",
}

export function StatusAnimalBadge({ status, className }: { status: StatusAnimal; className?: string }) {
  return <Badge className={cn(statusAnimalStyle[status], className)}>{statusAnimalLabel[status]}</Badge>
}

const statusPedidoStyle: Record<StatusPedido, string> = {
  pendente: "bg-amber-400/15 text-amber-300",
  aprovado: "bg-emerald-400/15 text-emerald-300",
  reprovado: "bg-red-400/15 text-red-300",
}

export function StatusPedidoBadge({ status }: { status: StatusPedido }) {
  return <Badge className={statusPedidoStyle[status]}>{statusPedidoLabel[status]}</Badge>
}

/** Ilustração do animal (o schema não tem foto): ícone da espécie sobre um fundo tonal. */
export function AnimalArt({
  especie,
  seed = 0,
  className,
  iconClassName,
}: {
  especie: Especie
  seed?: number
  className?: string
  iconClassName?: string
}) {
  const Icon = especie === "gato" ? Cat : Dog
  // variação sutil de ângulo e matiz para os cards não ficarem idênticos
  const angle = (seed * 47) % 360
  const hue = ((seed * 37) % 50) - 25
  return (
    <div
      className={cn("relative grid place-items-center overflow-hidden rounded-2xl bg-primary/10", className)}
      style={{
        backgroundImage: `linear-gradient(${angle}deg, oklch(from var(--brand) l c calc(h + ${hue}) / 30%), transparent 75%)`,
      }}
    >
      <Icon className={cn("size-14 text-primary drop-shadow-sm", iconClassName)} strokeWidth={1.5} />
    </div>
  )
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed px-6 py-12 text-center">
      <div className="mb-1 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      <p className="font-medium">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  )
}

/** Par rótulo/valor usado nas fichas de detalhes. */
export function Info({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-muted/60 px-4 py-3", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 font-medium">{children}</div>
    </div>
  )
}

/** Bloco de data (dia + mês) usado nas feiras de adoção. */
export function DateBlock({ iso, muted }: { iso: string; muted?: boolean }) {
  const d = new Date(`${iso}T00:00:00`)
  return (
    <div
      className={cn(
        "grid size-16 shrink-0 place-items-center content-center rounded-2xl",
        muted ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"
      )}
    >
      <span className="text-2xl leading-none font-semibold">{String(d.getDate()).padStart(2, "0")}</span>
      <span className="text-xs font-medium uppercase">{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
    </div>
  )
}
