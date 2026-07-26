import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";

/**
 * Casca fixa do sistema: sidebar recolhível à esquerda + topbar em cima.
 * No mobile a sidebar vira um Drawer que desliza por cima do conteúdo.
 */
export function DashboardLayout() {
  const [sidebarRecolhida, setSidebarRecolhida] = useState(false);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const itensBreadcrumb = useBreadcrumb();

  return (
    <div className="flex h-screen overflow-hidden bg-surface-subtle dark:bg-surface-dark">
      {/* Sidebar fixa (desktop) */}
      <div className="hidden md:block">
        <Sidebar recolhida={sidebarRecolhida} aoAlternar={() => setSidebarRecolhida((v) => !v)} />
      </div>

      {/* Drawer (mobile) */}
      <AnimatePresence>
        {drawerAberto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setDrawerAberto(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 md:hidden"
            >
              <Sidebar recolhida={false} aoAlternar={() => setDrawerAberto(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar aoAbrirMenuMobile={() => setDrawerAberto(true)} itensBreadcrumb={itensBreadcrumb} />
        <main className="flex-1 overflow-y-auto p-4 scrollbar-thin md:p-6">
          <div className="mx-auto w-full max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
