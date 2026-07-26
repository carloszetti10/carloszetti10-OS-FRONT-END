// Espelha AuthCreateDto / AuthDto do back (DTOs/AuthDto).
export interface LoginPayload {
  usuario: string;
  senha: string;
}

export interface AuthResponse {
  id: string;
  usuario: string;
  token: string;
  email: string;
}

// Claims que decodificamos do JWT (ver AuthService.Login no back:
// só existem "sub", "name" e claims "Permissao" — não existe claim de "role").
export interface JwtPayload {
  sub: string;
  name: string;
  Permissao?: string | string[];
  exp: number;
  [key: string]: unknown;
}
