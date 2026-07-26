import { z } from "zod";

const funcionarioSelecionadoSchema = z.object({
  idFuncionario: z.number(),
  responsavel: z.boolean(),
});

export const ordemServicoSchema = z.object({
  tituloOs: z.string().min(1, "O título é obrigatório."),
  descricao: z.string().optional().or(z.literal("")),
  idTipoAtendimento: z
    .number({ invalid_type_error: "Selecione o tipo de atendimento." })
    .int()
    .positive("Selecione o tipo de atendimento."),
  idCliente: z.number({ invalid_type_error: "Selecione o cliente." }).int().positive("Selecione o cliente."),
  dataHoraInicio: z.string().optional().or(z.literal("")),
  prazo: z.string().optional().or(z.literal("")),
  observacao: z.string().optional().or(z.literal("")),
  funcionarios: z
    .array(funcionarioSelecionadoSchema)
    .min(1, "Adicione ao menos um funcionário.")
    .refine((lista) => lista.filter((f) => f.responsavel).length === 1, {
      message: "Marque exatamente um funcionário como responsável.",
    }),
});

export type OrdemServicoFormValues = z.infer<typeof ordemServicoSchema>;

export const relatorioSchema = z.object({
  relatorioTecnico: z.string().min(1, "Escreva o relatório técnico."),
});
export type RelatorioFormValues = z.infer<typeof relatorioSchema>;
