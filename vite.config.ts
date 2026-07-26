import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Configuração do Vite. O alias "@" aponta para "src", assim os imports
// ficam mais limpos: import { Button } from "@/components/ui/Button"
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
});
