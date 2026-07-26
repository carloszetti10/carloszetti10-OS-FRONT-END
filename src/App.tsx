import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Toaster } from "@/components/ui/Toaster";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import OrdensServicoList from "@/pages/ordens-servico/OrdensServicoList";
import OrdemServicoDetalhe from "@/pages/ordens-servico/OrdemServicoDetalhe";
import ClientesList from "@/pages/clientes/ClientesList";
import FuncionariosList from "@/pages/funcionarios/FuncionariosList";
import TiposAtendimentoList from "@/pages/tipos-atendimento/TiposAtendimentoList";
import Perfil from "@/pages/Perfil";
import Configuracoes from "@/pages/Configuracoes";
import AssinaturaPublica from "@/pages/assinatura/AssinaturaPublica";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Pública — o cliente abre pelo link/QR code, sem estar logado no sistema */}
        <Route path="/assinar/:token" element={<AssinaturaPublica />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ordens-servico" element={<OrdensServicoList />} />
            <Route path="/ordens-servico/:id" element={<OrdemServicoDetalhe />} />
            <Route path="/clientes" element={<ClientesList />} />
            <Route path="/funcionarios" element={<FuncionariosList />} />
            <Route path="/tipos-atendimento" element={<TiposAtendimentoList />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}
