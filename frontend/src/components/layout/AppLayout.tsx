import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { Building2, Check, ChevronDown, LayoutDashboard, PawPrint, Plus, UserRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ShelterDialog } from "@/components/dialogs/ShelterDialog"
import { cn } from "@/lib/utils"
import { useDb } from "@/store/db"
import { ACCENTS, useSession } from "@/store/session"

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="mx-auto w-full max-w-7xl px-4 pb-8 text-center text-xs text-muted-foreground sm:px-6">
        PetMatch · protótipo de interface com dados fictícios mantidos apenas em memória.
      </footer>
    </div>
  )
}

function Navbar() {
  const { cnpj } = useSession()
  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
      isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )

  return (
    <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <PawPrint className="size-5" />
          </span>
          <span className="hidden text-lg font-semibold tracking-tight lg:inline">PetMatch</span>
        </Link>

        <nav className="ml-1 flex items-center gap-1">
          <NavLink to="/" end className={navClass}>
            <PawPrint className="size-4" />
            <span className="hidden sm:inline">Adotar</span>
          </NavLink>
          {cnpj && (
            <NavLink to="/painel" className={navClass}>
              <LayoutDashboard className="size-4" />
              <span className="hidden sm:inline">Painel do abrigo</span>
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <AccentSwitcher />
          <SessionSwitcher />
          <ShelterDialog
            trigger={
              <Button>
                <Plus />
                <span className="hidden md:inline">Cadastrar abrigo</span>
              </Button>
            }
          />
        </div>
      </div>
    </header>
  )
}

function AccentSwitcher() {
  const { accent, setAccent } = useSession()
  const atual = ACCENTS.find((a) => a.id === accent)!
  return (
    <>
      {/* Telas largas: bolinhas sempre visíveis para comparar rapidamente */}
      <div className="hidden items-center gap-1 rounded-full bg-muted/70 p-1 lg:flex" role="radiogroup" aria-label="Cor de destaque">
        {ACCENTS.map((a) => (
          <Tooltip key={a.id}>
            <TooltipTrigger asChild>
              <button
                role="radio"
                aria-checked={a.id === accent}
                aria-label={a.label}
                onClick={() => setAccent(a.id)}
                className={cn(
                  "grid size-6 place-items-center rounded-full transition-transform hover:scale-110",
                  a.id === accent && "ring-2 ring-foreground/80 ring-offset-2 ring-offset-background"
                )}
                style={{ background: a.swatch }}
              />
            </TooltipTrigger>
            <TooltipContent>{a.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      {/* Telas menores: menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden" aria-label="Cor de destaque">
            <span className="size-4 rounded-full" style={{ background: atual.swatch }} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Cor de destaque</DropdownMenuLabel>
          {ACCENTS.map((a) => (
            <DropdownMenuItem key={a.id} onSelect={() => setAccent(a.id)}>
              <span className="size-4 rounded-full" style={{ background: a.swatch }} />
              {a.label}
              {a.id === accent && <Check className="ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

function SessionSwitcher() {
  const { db } = useDb()
  const { cnpj, setCnpj } = useSession()
  const navigate = useNavigate()
  const atual = db.abrigo.find((a) => a.cnpj === cnpj)

  function entrar(novo: string | null) {
    setCnpj(novo)
    if (!novo) {
      toast("Você está navegando como visitante.")
      return
    }
    const nome = db.abrigo.find((a) => a.cnpj === novo)?.nome
    toast.success(`Modo abrigo: ${nome}`, { action: { label: "Abrir painel", onClick: () => navigate("/painel") } })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="max-w-56">
          {atual ? <Building2 className="text-primary" /> : <UserRound />}
          <span className="hidden truncate sm:inline">{atual ? atual.nome : "Visitante"}</span>
          <ChevronDown className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Modo de acesso (teste)</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => entrar(null)}>
          <UserRound />
          <div className="grid">
            <span>Visitante público</span>
            <span className="text-xs text-muted-foreground">Adotantes e doadores</span>
          </div>
          {!cnpj && <Check className="ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Membro do abrigo</DropdownMenuLabel>
        {db.abrigo.map((a) => (
          <DropdownMenuItem key={a.cnpj} onSelect={() => entrar(a.cnpj)}>
            <Building2 />
            <div className="grid min-w-0">
              <span className="truncate">{a.nome}</span>
              <span className="text-xs text-muted-foreground">
                {a.cidade}/{a.uf}
              </span>
            </div>
            {cnpj === a.cnpj && <Check className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
