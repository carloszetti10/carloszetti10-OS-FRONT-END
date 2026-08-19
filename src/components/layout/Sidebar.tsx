import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  UserCog,
  Tags,
  ShieldCheck,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { usePodeGerenciarPermissoes } from "@/hooks/usePermissoes";
import { LogoMark } from "@/assets/logo/LogoMark";

interface SidebarProps {
  recolhida: boolean;
  aoAlternar: () => void;
}

const ITENS_MENU = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, fim: true },
  { to: "/indicadores", label: "Indicadores", icon: BarChart3 },
  { to: "/ordens-servico", label: "Ordens de Serviço", icon: ClipboardList },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/funcionarios", label: "Funcionários", icon: UserCog },
  { to: "/tipos-atendimento", label: "Tipos de Atendimento", icon: Tags },
];

const SUBMENU_CONFIGURACAO = [
  { to: "/configuracoes", label: "Aparência", fim: true },
  { to: "/configuracoes/bitrix", label: "Bitrix" },
];

const classeItemMenu = (isActive: boolean) =>
  cn(
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
  );

/** Menu lateral fixo, recolhível (vira ícone-only), e Drawer no mobile (ver DashboardLayout) */
export function Sidebar({ recolhida, aoAlternar }: SidebarProps) {
  const podeGerenciarPermissoes = usePodeGerenciarPermissoes();
  const location = useLocation();
  const [configuracaoAberta, setConfiguracaoAberta] = useState(location.pathname.startsWith("/configuracoes"));

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-neutral-200 bg-white transition-all duration-200 dark:border-neutral-800 dark:bg-surface-dark",
        recolhida ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-neutral-100 px-4 dark:border-neutral-800">
        <LogoMark className="h-8 w-8 shrink-0" />
        {!recolhida && <span className="font-display text-lg font-bold uppercase tracking-tight">NorteSys</span>}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {ITENS_MENU.map(({ to, label, icon: Icon, fim }) => (
          <NavLink key={to} to={to} end={fim} className={({ isActive }) => classeItemMenu(isActive)} title={recolhida ? label : undefined}>
            <Icon className="h-5 w-5 shrink-0" />
            {!recolhida && <span>{label}</span>}
          </NavLink>
        ))}

        {podeGerenciarPermissoes && (
          <NavLink to="/permissoes" className={({ isActive }) => classeItemMenu(isActive)} title={recolhida ? "Permissões" : undefined}>
            <ShieldCheck className="h-5 w-5 shrink-0" />
            {!recolhida && <span>Permissões</span>}
          </NavLink>
        )}

        {/* Configuração > Bitrix — recolhida vira atalho direto pro Bitrix, sem submenu */}
        {recolhida ? (
          <NavLink to="/configuracoes/bitrix" className={({ isActive }) => classeItemMenu(isActive)} title="Configuração">
            <Settings className="h-5 w-5 shrink-0" />
          </NavLink>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setConfiguracaoAberta((aberta) => !aberta)}
              className={classeItemMenu(location.pathname.startsWith("/configuracoes")) + " w-full"}
              aria-expanded={configuracaoAberta}
            >
              <Settings className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-left">Configuração</span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", configuracaoAberta && "rotate-180")} />
            </button>

            {configuracaoAberta && (
              <div className="ml-4 mt-1 space-y-1 border-l border-neutral-200 pl-3 dark:border-neutral-800">
                {SUBMENU_CONFIGURACAO.map(({ to, label, fim }) => (
                  <NavLink key={to} to={to} end={fim} className={({ isActive }) => classeItemMenu(isActive)}>
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <button
        onClick={aoAlternar}
        className="flex items-center gap-2 border-t border-neutral-100 px-4 py-3 text-sm text-neutral-500 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
      >
        {recolhida ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        {!recolhida && "Recolher menu"}
      </button>
    </aside>
  );
}
