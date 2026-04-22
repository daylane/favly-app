export interface Produto {
  id: string;
  nome: string;
  marca: string;
  unidade: number;
  quantidadeAtual: number;
  quantidadeMinima: number;
  estoqueAbaixoDoMinimo: boolean;
  ultimoPreco: number;
  ultimoMercadoId: string;
  ultimaCompra: string;
  categoriaId: string;
  categoria?: string; // nome da categoria (join local)
}

export interface CriarProdutoPayload {
  grupoId: string;
  categoriaId: string;
  nome: string;
  unidade: number;
  quantidadeMinima: number;
  marca: string;
}

export interface EditarProdutoPayload {
  categoriaId: string;
  nome: string;
  unidade: number;
  quantidadeMinima: number;
  marca: string;
}

// Enum de unidades de medida
export const UNIDADES: { valor: number; label: string; sigla: string }[] = [
  { valor: 1,  label: 'Unidade',    sigla: 'un'  },
  { valor: 2,  label: 'Quilograma', sigla: 'kg'  },
  { valor: 3,  label: 'Grama',      sigla: 'g'   },
  { valor: 4,  label: 'Litro',      sigla: 'L'   },
  { valor: 5,  label: 'Mililitro',  sigla: 'ml'  },
  { valor: 6,  label: 'Caixa',      sigla: 'cx'  },
  { valor: 7,  label: 'Pacote',     sigla: 'pct' },
  { valor: 8,  label: 'Dúzia',      sigla: 'dz'  },
];