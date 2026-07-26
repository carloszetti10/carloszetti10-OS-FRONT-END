import { create } from "zustand";
import { persist } from "zustand/middleware";

type Tema = "light" | "dark";

interface ThemeState {
  tema: Tema;
  alternarTema: () => void;
  definirTema: (tema: Tema) => void;
}

/**
 * Estado global do tema claro/escuro, persistido em localStorage.
 * A classe "dark" é aplicada no <html> (ver aplicarClasseNoHtml), que é o
 * jeito que o Tailwind (darkMode: "class") espera pra alternar as variantes.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      tema: "light",
      alternarTema: () => {
        const novo = get().tema === "light" ? "dark" : "light";
        set({ tema: novo });
        aplicarClasseNoHtml(novo);
      },
      definirTema: (tema) => {
        set({ tema });
        aplicarClasseNoHtml(tema);
      },
    }),
    {
      name: "os-nortesys-theme",
      onRehydrateStorage: () => (state) => {
        if (state) aplicarClasseNoHtml(state.tema);
      },
    }
  )
);

function aplicarClasseNoHtml(tema: Tema) {
  const root = document.documentElement;
  if (tema === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}
