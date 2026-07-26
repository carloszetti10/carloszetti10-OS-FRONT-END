import { z } from "zod";

export const loginSchema = z.object({
  usuario: z.string().min(1, "Informe seu usuário."),
  senha: z.string().min(1, "Informe sua senha."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
