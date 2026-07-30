import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/schemas/authSchema";
import { useLogin } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { extrairMensagemErro } from "@/utils/errorHandler";
import { LogoFull } from "@/assets/logo/LogoFull";

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const { mutate: entrar, isPending, error } = useLogin();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4 dark:bg-surface-dark">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoFull />
        </div>

        <form
          onSubmit={handleSubmit((dados) => entrar(dados))}
          className="animate-slide-up space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-card dark:border-neutral-800 dark:bg-neutral-900"
        >
          <Input
            label="Usuário"
            autoComplete="username"
            autoFocus
            erro={errors.usuario?.message}
            {...register("usuario")}
          />
          <Input
            label="Senha"
            type="password"
            autoComplete="current-password"
            erro={errors.senha?.message}
            {...register("senha")}
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950">
              {extrairMensagemErro(error)}
            </p>
          )}

          <Button type="submit" className="w-full" carregando={isPending}>
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
