import { Link } from "react-router-dom"
import { Building2, Mars, Venus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AnimalArt } from "@/components/common"
import { idade } from "@/lib/format"
import type { Abrigo, Animal } from "@/types/db"

/** Card do catálogo. Usa o padrão "stretched link" para o perfil, sem aninhar <a>. */
export function AnimalCard({ animal, abrigo }: { animal: Animal; abrigo?: Abrigo }) {
  const SexIcon = animal.sexo === "M" ? Mars : Venus
  return (
    <article className="group relative flex flex-col gap-3 rounded-3xl bg-card p-3 ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 hover:ring-primary/40">
      <AnimalArt especie={animal.especie} seed={animal.id} className="aspect-[16/9] w-full sm:aspect-[4/3]" />
      <div className="grid gap-1.5 px-1 pb-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-lg font-semibold">
            <Link to={`/animais/${animal.id}`} className="outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:ring-2 focus-visible:after:ring-ring">
              {animal.nome}
            </Link>
          </h3>
          <SexIcon className={animal.sexo === "M" ? "size-4 text-sky-300" : "size-4 text-pink-300"} aria-label={animal.sexo === "M" ? "Macho" : "Fêmea"} />
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {animal.raca} · {idade(animal.data_nascimento)}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{animal.especie === "gato" ? "Gato" : "Cachorro"}</Badge>
          {animal.castrado && <Badge variant="secondary">Castrado</Badge>}
        </div>
        {abrigo && (
          <Link
            to={`/abrigos/${abrigo.cnpj}`}
            className="relative z-10 mt-1 flex w-fit max-w-full items-center gap-1.5 rounded-full py-0.5 pr-2 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            <Building2 className="size-3.5 shrink-0" />
            <span className="truncate">
              {abrigo.nome} · {abrigo.cidade}/{abrigo.uf}
            </span>
          </Link>
        )}
      </div>
    </article>
  )
}
