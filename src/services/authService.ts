import { api } from "@/api/axios";
import type { LoginPayload, AuthResponse } from "@/types/auth";

export const authService = {
  // POST /api/Auth/login — único endpoint de autenticação existente no back
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/Auth/login", payload);
    return data;
  },
};
