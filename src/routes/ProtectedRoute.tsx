import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

/** Bloqueia acesso direto por URL a qualquer rota filha se não estiver logado */
export function ProtectedRoute() {
  const estaAutenticado = useAuthStore((s) => s.estaAutenticado);
  const location = useLocation();

  if (!estaAutenticado()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
