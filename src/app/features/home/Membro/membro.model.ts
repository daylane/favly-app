export interface Membro {
  id: string;
  nome: string;
  email: string;
  isAdmin: boolean;
  isCurrentUser?: boolean;
}

