import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import type { LoginPayload } from "@/types/auth";

export function useLogin() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (auth) => {
      login(auth);
      navigate("/", { replace: true });
    },
  });
}
