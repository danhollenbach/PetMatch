import { useEffect, useRef, useState } from "react"
import { AnimalArt, attempt } from "@/components/common"
import { Button } from "@/components/ui/button"
import { request } from "@/lib/api"
import type { Animal } from "@/types/db"

export function AnimalPhoto({ animal, editable }: { animal: Animal; editable: boolean }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [version, setVersion] = useState(0)
  const [pending, setPending] = useState(false)
  const lock = useRef(false)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const abort = new AbortController()
    let objectUrl: string | undefined
    setUrl(null); setError("")
    async function load() {
      const response = await fetch(`/api/animais/${animal.id}/foto`, { signal: abort.signal })
      if (response.status === 404) return
      if (!response.ok) throw new Error(response.status === 501 ? "Foto aguardando implementação das consultas SQL." : "Não foi possível carregar a foto.")
      const blob = await response.blob()
      if (abort.signal.aborted) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    }
    void load().catch(cause => { if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : "Falha ao carregar foto.") })
    return () => { abort.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [animal.id, version])
  async function change(file?: File) {
    if (lock.current) return
    lock.current = true; setPending(true)
    const ok = await attempt(async () => {
      if (file && (!['image/jpeg','image/png'].includes(file.type) || file.size > 5 * 1024 * 1024)) throw new Error("Selecione JPEG ou PNG de até 5 MB.")
      const body = new FormData()
      if (file) body.append("foto", file)
      await request(`/animais/${animal.id}/foto`, { method: file ? "PUT" : "DELETE", ...(file ? { body } : {}) })
    }, file ? "Foto salva." : "Foto removida.")
    lock.current = false; setPending(false)
    if (ok) setVersion(value => value + 1)
    if (input.current) input.current.value = ""
  }
  return <div className="grid gap-3">
    {url ? <img src={url} alt={`Foto de ${animal.nome}`} className="aspect-square w-full rounded-3xl object-cover" />
      : <AnimalArt especie={animal.especie} seed={animal.id} className="aspect-square w-full rounded-3xl" iconClassName="size-28" />}
    {error && <p role="status" className="text-sm text-muted-foreground">{error}</p>}
    {editable && <div className="flex flex-wrap gap-2">
      <input ref={input} type="file" accept="image/jpeg,image/png" aria-label="Foto do animal" className="sr-only" disabled={pending}
        onChange={event => { const file = event.target.files?.[0]; if (file) void change(file) }} />
      <Button type="button" variant="secondary" disabled={pending} onClick={() => input.current?.click()}>{pending ? "Salvando…" : "Enviar / substituir foto"}</Button>
      {url && <Button type="button" variant="outline" disabled={pending} onClick={() => void change()}>Remover foto</Button>}
    </div>}
  </div>
}
