import { useRef, useState, type FormEvent, type ReactNode } from "react"
import { toast } from "sonner"

/** Bloqueia reenvio inclusive antes de React renderizar o estado de espera. */
export function AsyncForm({ onSubmit, className, children }: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  className?: string
  children: ReactNode
}) {
  const lock = useRef(false)
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lock.current) return
    lock.current = true
    setPending(true)
    try { await onSubmit(event) }
    catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao enviar formulário.") }
    finally { lock.current = false; setPending(false) }
  }
  return <form onSubmit={submit} aria-busy={pending}>
    <fieldset disabled={pending} className={className}>{children}</fieldset>
    {pending && <p role="status" className="mt-3 text-sm text-muted-foreground">Salvando…</p>}
  </form>
}
