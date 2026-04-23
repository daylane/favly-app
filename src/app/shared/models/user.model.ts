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
  grupoId: string;
  grupoNome: string;
  userId?: string; // retornado pelo backend, usado como membroId em movimentações
}