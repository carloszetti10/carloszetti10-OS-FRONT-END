import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useCriarFuncionario, useAtualizarFuncionario } from "@/hooks/useFuncionarios";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";
import { TipoUsuario, TIPO_USUARIO_LABEL } from "@/types/enums";
import type { Funcionario } from "@/types/funcionario";

// Um schema só, com senha/tipoUsuario/ativo opcionais — o modo (criação ou
// edição) decide, via superRefine, quais campos viram obrigatórios. Isso
// evita ter dois tipos de formulário diferentes pro React Hook Form lidar.
const funcionarioSchema = z
  .object({
    modo: z.enum(["criar", "editar"]),
    nome: z.string().min(1, "O nome é obrigatório."),
    userName: z.string().min(1, "O usuário é obrigatório."),
    email: z.string().email("E-mail inválido."),
    senha: z.string().optional(),
    tipoUsuario: z.coerce.number().int().optional(),
    ativo: z.boolean().optional(),
  })
  .superRefine((dados, ctx) => {
    if (dados.modo === "criar" && !dados.senha) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A senha é obrigatória.", path: ["senha"] });
    }
  });

type FuncionarioFormValues = z.infer<typeof funcionarioSchema>;

interface FuncionarioFormModalProps {
  aberto: boolean;
  aoFechar: () => void;
  funcionarioEmEdicao?: Funcionario | null;
}

export function FuncionarioFormModal({ aberto, aoFechar, funcionarioEmEdicao }: FuncionarioFormModalProps) {
  const editando = !!funcionarioEmEdicao;
  const mostrarToast = useToastStore((s) => s.mostrar);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FuncionarioFormValues>({ resolver: zodResolver(funcionarioSchema) });

  useEffect(() => {
    if (!aberto) return;
    if (editando && funcionarioEmEdicao) {
      reset({
        modo: "editar",
        nome: funcionarioEmEdicao.nome,
        userName: funcionarioEmEdicao.userName,
        email: funcionarioEmEdicao.email,
        ativo: funcionarioEmEdicao.ativo,
      });
    } else {
      reset({ modo: "criar", nome: "", userName: "", email: "", senha: "", tipoUsuario: TipoUsuario.Tecnico });
    }
  }, [aberto, editando, funcionarioEmEdicao, reset]);

  const { mutate: criar, isPending: criando, error: erroCriar } = useCriarFuncionario();
  const { mutate: atualizar, isPending: atualizando, error: erroAtualizar } = useAtualizarFuncionario(
    funcionarioEmEdicao?.id ?? 0
  );

  const erro = erroCriar ?? erroAtualizar;
  const salvando = criando || atualizando;

  function aoSubmeter(dados: FuncionarioFormValues) {
    const aoTerSucesso = () => {
      mostrarToast(editando ? "Funcionário atualizado." : "Funcionário cadastrado.", "sucesso");
      aoFechar();
    };

    if (dados.modo === "editar") {
      atualizar(
        { nome: dados.nome, userName: dados.userName, email: dados.email, ativo: dados.ativo ?? true },
        { onSuccess: aoTerSucesso }
      );
    } else {
      criar(
        {
          nome: dados.nome,
          userName: dados.userName,
          email: dados.email,
          senha: dados.senha!,
          tipoUsuario: (dados.tipoUsuario ?? TipoUsuario.Tecnico) as TipoUsuario,
        },
        { onSuccess: aoTerSucesso }
      );
    }
  }

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo={editando ? "Editar funcionário" : "Novo funcionário"}>
      <form onSubmit={handleSubmit(aoSubmeter)} className="space-y-4">
        <input type="hidden" {...register("modo")} />
        <Input label="Nome" erro={errors.nome?.message} {...register("nome")} />
        <Input label="Usuário (login)" erro={errors.userName?.message} {...register("userName")} />
        <Input label="E-mail" type="email" erro={errors.email?.message} {...register("email")} />

        {!editando && (
          <>
            <Input label="Senha" type="password" erro={errors.senha?.message} {...register("senha")} />
            <Select label="Tipo de usuário" {...register("tipoUsuario")}>
              {Object.entries(TIPO_USUARIO_LABEL).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>{rotulo}</option>
              ))}
            </Select>
          </>
        )}

        {editando && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("ativo")} /> Funcionário ativo
          </label>
        )}

        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950">
            {extrairMensagemErro(erro)}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" carregando={salvando}>{editando ? "Salvar alterações" : "Cadastrar"}</Button>
        </div>
      </form>
    </Modal>
  );
}
