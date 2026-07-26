import { useState } from "react";
import { Menu, Sun, Moon, Bell, LogOut, ChevronDown, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { Avatar } from "@/components/ui/Avatar";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface TopbarProps {
  aoAbrirMenuMobile: () => void;
  itensBreadcrumb: { label: string; to?: string }[];
}

export function Topbar({ aoAbrirMenuMobile, itensBreadcrumb }: TopbarProps) {
  const [menuAberto, setMenuAberto] = useState(false);
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  const { tema, alternarTema } = useThemeStore();
  const navigate = useNavigate();

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-surface-dark md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={aoAbrirMenuMobile}
          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Breadcrumb itens={itensBreadcrumb} />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={alternarTema}
          aria-label="Alternar tema"
          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          {tema === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        <button className="relative rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <Bell className="h-5 w-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuAberto((v) => !v)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Avatar nome={usuario?.usuario ?? "?"} />
            <span className="hidden text-sm font-medium sm:block">{usuario?.usuario}</span>
            <ChevronDown className="hidden h-4 w-4 text-neutral-400 sm:block" />
          </button>

          {menuAberto && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-card dark:border-neutral-800 dark:bg-neutral-900">
                <button
                  onClick={() => {
                    setMenuAberto(false);
                    navigate("/perfil");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <UserIcon className="h-4 w-4" /> Meu perfil
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate("/login", { replace: true });
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
