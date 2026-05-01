export interface Mercado {
  id: string;
  nome: string;
  endereco: string;
  ativo: boolean;
}

export interface CriarMercadoPayload {
  nome: string;
  endereco: string;
}

export interface AtualizarMercadoPayload {
  nome: string;
  endereco: string;
}
