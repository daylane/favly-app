export interface Categoria {
  id: string;
  nome: string;
  icone: string;
  totalProdutos: number;
}

export interface CriarCategoriaPayload {
  nome: string;
  icone: string;
}

export interface EditarCategoriaPayload {
  nome: string;
  icone: string;
}