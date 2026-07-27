import { useLocation } from "react-router-dom";

const ROTULOS: Record<string, string> = {
  "": "Dashboard",
  "ordens-servico": "Ordens de Serviço",
  clientes: "Clientes",
  funcionarios: "Funcionários",
  "tipos-atendimento": "Tipos de Atendimento",
  permissoes: "Permissões",
  perfil: "Meu perfil",
  configuracoes: "Configurações",
};

/** Gera as migalhas de pão a partir do path atual da URL */
export function useBreadcrumb() {
  const { pathname } = useLocation();
  const partes = pathname.split("/").filter(Boolean);

  if (partes.length === 0) {
    return [{ label: "Dashboard" }];
  }

  return partes.map((parte, i) => {
    const to = "/" + partes.slice(0, i + 1).join("/");
    const label = ROTULOS[parte] ?? parte;
    const ultimo = i === partes.length - 1;
    return ultimo ? { label } : { label, to };
  });
}
