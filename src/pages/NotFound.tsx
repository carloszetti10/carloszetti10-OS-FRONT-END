import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-subtle text-center dark:bg-surface-dark">
      <p className="font-display text-7xl font-bold text-brand-600">404</p>
      <div>
        <h1 className="text-xl font-semibold">Página não encontrada</h1>
        <p className="text-sm text-neutral-500">O endereço que você tentou acessar não existe.</p>
      </div>
      <Link to="/">
        <Button>Voltar para o Dashboard</Button>
      </Link>
    </div>
  );
}
