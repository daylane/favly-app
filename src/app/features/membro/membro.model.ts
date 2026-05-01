export interface Membro {
  id: string;
  usuarioId: string;
  nome: string;
  email: string;
  apelido: string;
  avatar?: string;
  role?: string;       // 'admin' | 'membro' — campo real da API
  isAdmin?: boolean;   // pode vir do backend ou derivado de role
  isCurrentUser?: boolean;
}

