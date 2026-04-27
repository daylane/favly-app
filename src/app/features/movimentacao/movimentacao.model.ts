/** TipoMovimentacao: 1 = Entrada, 2 = Saida */
export type TipoMovimentacao = 1 | 2;

export function isEntrada(tipo: TipoMovimentacao): boolean {
  return tipo === 1;
}

export interface MovimentacaoItem {
  id:           string;
  produtoId:    string;
  nomeProduto:  string;
  membroId:     string;
  nomeMembro:   string;
  mercadoId:    string;
  nomeMercado:  string;
  tipo:         TipoMovimentacao;
  quantidade:   number;
  preco:        number;
  observacao:   string;
  dataCriacao:  string;
}

export interface SaidaPayload {
  produtoId:  string;
  quantidade: number;
}

export interface SaidaDialogData {
  produtos:              ProdutoSimples[];
  produtoPreSelecionado?: ProdutoSimples;
}

export interface EntradaPayload {
  produtoId:  string;
  quantidade: number;
  preco:      number;
  mercadoId:  string;
  observacao: string;
}

export interface MercadoSimples {
  id:   string;
  nome: string;
}

export interface ProdutoSimples {
  id:              string;
  nome:            string;
  unidade:         number;
  quantidadeAtual: number;
}

export interface EntradaDialogData {
  produtos:              ProdutoSimples[];
  mercados:              MercadoSimples[];
  produtoPreSelecionado?: ProdutoSimples;
}

export const UNIDADES_MAP: Record<number, string> = {
  1: 'un', 2: 'kg', 3: 'g', 4: 'L', 5: 'ml', 6: 'cx', 7: 'pct', 8: 'dz'
};