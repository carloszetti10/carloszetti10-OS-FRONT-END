import { useAuthStore } from "@/stores/authStore";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

export default function Perfil() {
  const usuario = useAuthStore((s) => s.usuario);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Meu perfil</h1>
      <Card className="flex items-center gap-4">
        <Avatar nome={usuario?.usuario ?? "?"} className="h-14 w-14 text-lg" />
        <div>
          <p className="font-medium">{usuario?.usuario}</p>
          <p className="text-sm text-neutral-500">{usuario?.email}</p>
        </div>
      </Card>
    </div>
  );
}
