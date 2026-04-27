import { Component, input, output, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { Produto, UNIDADES }     from '../produto.model';
import { Categoria }             from '../../categoria/categoria.model';
import { MovimentacaoItem, isEntrada } from '../../movimentacao/movimentacao.model';

@Component({
  selector: 'app-produto-detalhe',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, MatIconModule],
  templateUrl: './produto-detalhe.component.html',
  styleUrls:   ['./produto-detalhe.component.scss'],
})
export class ProdutoDetalheComponent {

  produto       = input.required<Produto>();
  categorias    = input<Categoria[]>([]);
  movimentacoes = input<MovimentacaoItem[]>([]);

  voltar        = output<void>();
  entradaClick  = output<void>();
  saidaClick    = output<void>();
  editarClick   = output<void>();

  readonly isEntrada = isEntrada;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  getUnidade(): string {
    return UNIDADES.find(u => u.valor === this.produto().unidade)?.sigla ?? 'un';
  }

  getCategoriaNome(): string {
    return this.categorias().find(c => c.id === this.produto().categoriaId)?.nome ?? '—';
  }

  getCategoriaIcone(): string {
    return this.categorias().find(c => c.id === this.produto().categoriaId)?.icone ?? '▣';
  }

  // ── Movimentações do produto ─────────────────────────────────────────────────
  movsProduto = computed(() =>
    this.movimentacoes()
      .filter(m => m.produtoId === this.produto().id)
      .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()),
  );

  entradas = computed(() =>
    this.movsProduto().filter(m => isEntrada(m.tipo) && m.preco > 0),
  );

  // ── Estatísticas de preço ────────────────────────────────────────────────────
  precoMedio = computed((): number | null => {
    const e = this.entradas();
    if (e.length === 0) return null;
    return e.reduce((acc, m) => acc + m.preco, 0) / e.length;
  });

  menorPreco = computed((): { preco: number; mercado: string } | null => {
    const e = this.entradas();
    if (e.length === 0) return null;
    const m = e.reduce((min, cur) => cur.preco < min.preco ? cur : min);
    return { preco: m.preco, mercado: m.nomeMercado };
  });

  ultimaCompra = computed((): { preco: number; mercado: string; data: string } | null => {
    const e = this.entradas();
    if (e.length === 0) return null;
    const m = e[0]; // já ordenado por data desc
    return { preco: m.preco, mercado: m.nomeMercado, data: m.dataCriacao };
  });

  // ── Preço por mercado ────────────────────────────────────────────────────────
  precoPorMercado = computed(() => {
    const byMercado = new Map<string, { nome: string; total: number; count: number }>();
    for (const m of this.entradas()) {
      if (!m.nomeMercado) continue;
      const cur = byMercado.get(m.mercadoId) ?? { nome: m.nomeMercado, total: 0, count: 0 };
      cur.total += m.preco;
      cur.count += 1;
      byMercado.set(m.mercadoId, cur);
    }
    const lista = [...byMercado.values()]
      .map(({ nome, total, count }) => ({ nome, media: total / count }))
      .sort((a, b) => a.media - b.media);

    const maxMedia = lista.length > 0 ? Math.max(...lista.map(l => l.media)) : 1;
    const minMedia = lista.length > 0 ? lista[0].media : 0;
    return lista.map((l, i) => ({
      ...l,
      pct:      Math.round((l.media / maxMedia) * 100),
      cheapest: i === 0 && lista.length > 1 && l.media < minMedia * 1.01 || lista.length === 1,
    }));
  });

  // ── Barra de estoque (segmentada) ────────────────────────────────────────────
  stockCells = computed(() => {
    const p        = this.produto();
    const CELLS    = 20;                               // sempre 20 colunas visuais
    const max      = (p.quantidadeMinima || 5) * 2;   // meta = 2× o mínimo
    const filled   = Math.min(Math.round((p.quantidadeAtual / max) * CELLS), CELLS);
    const critical = p.quantidadeAtual < p.quantidadeMinima;
    return Array.from({ length: CELLS }, (_, i) => ({ filled: i < filled, critical }));
  });
}
