import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppLayout } from "@/components/layout/AppLayout"
import { AnimalPage } from "@/pages/AnimalPage"
import { CatalogPage } from "@/pages/CatalogPage"
import { PanelPage } from "@/pages/PanelPage"
import { ShelterPage } from "@/pages/ShelterPage"
import { DbProvider } from "@/store/db"
import { SessionProvider } from "@/store/session"

export default function App() {
  return (
    <DbProvider>
      <SessionProvider>
        <TooltipProvider delayDuration={200}>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<CatalogPage />} />
                <Route path="animais/:id" element={<AnimalPage />} />
                <Route path="abrigos/:cnpj" element={<ShelterPage />} />
                <Route path="painel" element={<PanelPage />} />
                <Route path="*" element={<CatalogPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster position="bottom-center" richColors={false} />
        </TooltipProvider>
      </SessionProvider>
    </DbProvider>
  )
}
