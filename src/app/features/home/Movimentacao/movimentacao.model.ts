export interface MovimentacaoItem {
  id: string;
  produtoId: string;
  produto: string;
  categoria: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  unidade: string;
  data: string;
}

export interface EntradaPayload {
  produtoId: string;
  membroId: string;
  quantidade: number;
  preco: number;
  mercadoId: string;
  observacao: string;
}

export interface EntradaDialogData {
  produtos: ProdutoSimples[];
  produtoPreSelecionado?: ProdutoSimples;
}

export interface ProdutoSimples {
  id: string;
  nome: string;
  unidade: number;
}

export const UNIDADES_MAP: Record<number, string> = {
  1: 'un', 2: 'kg', 3: 'g', 4: 'L', 5: 'ml', 6: 'cx', 7: 'pct', 8: 'dz'
};