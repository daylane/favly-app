export interface User {
  id: string;
  nome: string;
  email: string;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface AuthResponse {
  token: string;
  nome: string;
  email: string;
  expiracao: string;
  avatar: string;
  grupoId: string;
  grupoNome: string;
  userId?: string;
}

/** Subconjunto usado por salvarSessao — permite fontes parciais (ex: convite) */
export interface SessaoPayload {
  token?: string; // ignorado — token trafega via cookie httpOnly
  nome?: string;
  email?: string;
  grupoId?: string;
  grupoNome?: string;
  userId?: string;
  avatar?: string;
}