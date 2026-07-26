import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function Configuracoes() {
  const { tema, definirTema } = useThemeStore();

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Configurações</h1>
      <Card>
        <h2 className="mb-3 font-display font-semibold">Aparência</h2>
        <div className="flex gap-2">
          <Button variant={tema === "light" ? "primary" : "secondary"} size="sm" onClick={() => definirTema("light")}>
            <Sun className="h-4 w-4" /> Claro
          </Button>
          <Button variant={tema === "dark" ? "primary" : "secondary"} size="sm" onClick={() => definirTema("dark")}>
            <Moon className="h-4 w-4" /> Escuro
          </Button>
        </div>
      </Card>
    </div>
  );
}
