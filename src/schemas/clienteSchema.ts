import { z } from "zod";
import { TipoPessoa } from "@/types/enums";

// Validações aqui são só de UX (feedback imediato no campo). A validação
// definitiva de negócio (documento válido, CEP existente, etc.) é sempre
// feita pelo back — o front nunca decide sozinho se algo é aceito ou não.
export const clienteSchema = z
  .object({
    tipoPessoa: z.nativeEnum(TipoPessoa),
    nomeFantasia: z.string().min(1, "O nome é obrigatório.").max(100),
    razaoSocial: z.string().max(100).optional().or(z.literal("")),
    documento: z.string().min(1, "O documento é obrigatório."),
    email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
    telefone: z.string().optional().or(z.literal("")),
    cep: z.string().min(1, "O CEP é obrigatório."),
    uf: z.string().max(2).optional().or(z.literal("")),
    cidade: z.string().max(150).optional().or(z.literal("")),
    bairro: z.string().max(150).optional().or(z.literal("")),
    rua: z.string().max(150).optional().or(z.literal("")),
    numero: z.string().max(20).optional().or(z.literal("")),
    ativo: z.boolean().default(true),
  })
  .refine(
    (dados) => dados.tipoPessoa !== TipoPessoa.Juridica || !!dados.razaoSocial,
    { message: "A Razão Social é obrigatória para Pessoa Jurídica.", path: ["razaoSocial"] }
  );

export type ClienteFormValues = z.infer<typeof clienteSchema>;