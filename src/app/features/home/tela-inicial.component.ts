import {
  Component, OnInit, OnDestroy,
  inject, signal, computed, effect, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatToolbarModule }           from '@angular/material/toolbar';
import { MatButtonModule }            from '@angular/material/button';
import { MatIconModule }              from '@angular/material/icon';
import { MatCardModule }              from '@angular/material/card';
import { MatChipsModule }             from '@angular/material/chips';
import { MatMenuModule }              from '@angular/material/menu';
import { MatBadgeModule }             from '@angular/material/badge';
import { MatDividerModule }           from '@angular/material/divider';
import { MatTooltipModule }           from '@angular/material/tooltip';
import { MatRippleModule }            from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }   from '@angular/material/progress-spinner';
import { MatSidenavModule }           from '@angular/material/sidenav';

import { AuthService }              from '../../core/services/auth.service';
import { CategoriaService }         from '../categoria/categoria.service';
import { Categoria }                from '../categoria/categoria.model';
import { CategoriaDialogComponent } from '../categoria/dialogs/categoria-dialog.component';
import { ProdutoService }           from '../produto/produto.service';
import { Produto, UNIDADES }        from '../produto/produto.model';
import { ProdutoDrawerComponent }   from '../produto/drawer/produto-drawer.component';
import { MovimentacaoService }      from '../movimentacao/movimentacao.service';
import { MovimentacaoItem }         from '../movimentacao/movimentacao.model';
import { EntradaDialogComponent }   from '../movimentacao/entrada/entrada-dialog.component';
import { SaidaDialogComponent }    from '../movimentacao/saida/saida-dialog.component';
import { ProdutoDetalheComponent } from '../produto/detalhe/produto-detalhe.component';
import { MercadoComponent, MercadoDialogData } from '../Mercado/mercado.component';
import { MercadoService }           from '../Mercado/services/mercado.service';
import { Mercado }                  from '../Mercado/services/mercado.model';
import { isEntrada }                from '../movimentacao/movimentacao.model';

import { SidebarComponent }         from '../../shared/components/sidebar/sidebar.component';
import { GrupoGerenciarComponent }  from './grupo/grupo-gerenciar.component';
import { TabType, MaisTelaType }    from '../../shared/types/navigation.types';

/** Cor de avatar baseada no índice do char inicial do nome */
const AVATAR_COLORS = [
  '#4ade80', '#f97316', '#a78bfa', '#38bdf8',
  '#fb7185', '#facc15', '#34d399', '#60a5fa',
];

function avatarColor(nome: string): string {
  const idx = (nome?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
    MatRippleModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    ProdutoDrawerComponent,
    ProdutoDetalheComponent,
    SidebarComponent,
    GrupoGerenciarComponent,
  ],
  templateUrl: './tela-inicial.component.html',
  styleUrls: ['./tela-inicial.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {

  private router              = inject(Router);
  private authService         = inject(AuthService);
  private categoriaService    = inject(CategoriaService);
  private mercadoService      = inject(MercadoService);
  private produtoService      = inject(ProdutoService);
  private movimentacaoService = inject(MovimentacaoService);
  private dialog              = inject(MatDialog);
  private snackBar            = inject(MatSnackBar);
  private destroy$            = new Subject<void>();
  private platformId          = inject(PLATFORM_ID);

  usuario   = this.authService.getUsuario();
  grupoNome = signal<string | null>(this.authService.getGrupoNome());

  // ── Navegação ─────────────────────────────────────────────────────────────
  tab      = signal<TabType>('inicio');
  maisTela = signal<MaisTelaType>(null);

  // ── Tema ──────────────────────────────────────────────────────────────────
  darkMode = signal<boolean>(false);

  // ── Loading ───────────────────────────────────────────────────────────────
  isLoadingCategorias    = signal(false);
  isLoadingProdutos      = signal(false);
  isLoadingBaixoEstoque  = signal(false);
  isLoadingMovimentacoes = signal(false);
  isLoadingMercado       = signal(false);

  // ── Dados ─────────────────────────────────────────────────────────────────
  categorias           = signal<Categoria[]>([]);
  mercados             = signal<Mercado[]>([]);
  produtos             = signal<Produto[]>([]);
  produtosBaixoEstoque = signal<Produto[]>([]);
  movimentacoes        = signal<MovimentacaoItem[]>([]);

  // ── UI ────────────────────────────────────────────────────────────────────
  filtroCategoriaAtivo = signal<string>('todos');
  filtroMarca          = signal<string>('');
  searchQuery          = signal<string>('');
  sortBy               = signal<'nome' | 'quantidade' | 'preco'>('nome');
  drawerAberto         = signal(false);
  produtoEditando      = signal<Produto | null>(null);
  produtoSelecionadoId = signal<string | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  totalCategorias     = computed(() => this.categorias().length);
  produtoSelecionado  = computed(() =>
    this.produtos().find(p => p.id === this.produtoSelecionadoId()) ?? null,
  );
  marcasDisponiveis = computed(() =>
    [...new Set(this.produtos().map(p => p.marca).filter(m => !!m))].sort(),
  );
  temFiltrosAtivos  = computed(() =>
    this.filtroCategoriaAtivo() !== 'todos' ||
    this.filtroMarca() !== '' ||
    this.searchQuery() !== ''
  );

  /** Mercado com mais itens em baixo estoque — base para a "dica do favly" */
  dicaFavly = computed(() => {
    const baixo = this.produtosBaixoEstoque().filter(p => !!p.ultimoMercadoId);
    if (baixo.length === 0) return null;

    const byMercado = new Map<string, Produto[]>();
    for (const p of baixo) {
      const lista = byMercado.get(p.ultimoMercadoId) ?? [];
      lista.push(p);
      byMercado.set(p.ultimoMercadoId, lista);
    }

    let bestId    = '';
    let bestItens: Produto[] = [];
    for (const [id, itens] of byMercado) {
      if (itens.length > bestItens.length) { bestId = id; bestItens = itens; }
    }

    const mercado = this.mercados().find(m => m.id === bestId);
    return mercado ? { mercado, itens: bestItens } : null;
  });
  totalProdutos     = computed(() => this.produtos().length);
  totalCriticos     = computed(() => this.produtosBaixoEstoque().length);
  valorTotalEstoque = computed(() =>
    this.produtos().reduce((acc, p) => acc + (p.ultimoPreco ?? 0) * p.quantidadeAtual, 0),
  );

  movimentacoesRecentes = computed(() => this.movimentacoes().slice(0, 5));

  produtosFiltrados = computed(() => {
    let lista = this.produtos();

    // filtro categoria
    const f = this.filtroCategoriaAtivo();
    if (f !== 'todos') {
      const catId = this.categorias().find(c => c.nome === f)?.id;
      if (catId) lista = lista.filter(p => p.categoriaId === catId);
    }

    // filtro marca
    const m = this.filtroMarca();
    if (m) lista = lista.filter(p => p.marca?.toLowerCase() === m.toLowerCase());

    // busca por nome
    const q = this.searchQuery().toLowerCase().trim();
    if (q) lista = lista.filter(p => p.nome.toLowerCase().includes(q));

    // ordenação
    const s = this.sortBy();
    if (s === 'nome')       return [...lista].sort((a, b) => a.nome.localeCompare(b.nome));
    if (s === 'quantidade') return [...lista].sort((a, b) => b.quantidadeAtual - a.quantidadeAtual);
    if (s === 'preco')      return [...lista].sort((a, b) => (b.ultimoPreco ?? 0) - (a.ultimoPreco ?? 0));
    return lista;
  });

  relatorioCategoria = computed(() => {
    const total = this.valorTotalEstoque();
    if (total === 0) return [];
    return this.categorias()
      .map(cat => {
        const valor = this.produtos()
          .filter(p => p.categoriaId === cat.id)
          .reduce((acc, p) => acc + (p.ultimoPreco ?? 0) * p.quantidadeAtual, 0);
        return { ...cat, valor, pct: Math.round((valor / total) * 100) };
      })
      .filter(c => c.valor > 0)
      .sort((a, b) => b.valor - a.valor);
  });

  // ── Constructor ───────────────────────────────────────────────────────────
  constructor() {
    const saved       = this.safeLocalStorage('get', 'favly-theme');
    const prefersDark = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
    this.darkMode.set(saved === 'dark' || (!saved && prefersDark));

    effect(() => {
      const dark = this.darkMode();
      if (typeof document !== 'undefined') document.body.classList.toggle('favly-dark', dark);
      this.safeLocalStorage('set', 'favly-theme', dark ? 'dark' : 'light');
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.carregarCategorias();
    this.carregarProdutos();
    this.carregarBaixoEstoque();
    this.carregarMovimentacoes();
    this.carregarMercados();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (isPlatformBrowser(this.platformId)) document.body.classList.remove('favly-dark');
  }

  // ── Navegação ─────────────────────────────────────────────────────────────
  setTab(t: TabType): void {
    this.tab.set(t);
    this.maisTela.set(null);
    this.produtoSelecionadoId.set(null); // fecha detalhe ao trocar de aba
  }

  abrirSubtela(tela: MaisTelaType): void {
    this.maisTela.set(tela);
    this.produtoSelecionadoId.set(null); // fecha detalhe ao abrir subtela
  }
  voltarSubtela(): void { this.maisTela.set(null); }

  // ── Categorias ────────────────────────────────────────────────────────────
  carregarCategorias(): void {
    this.isLoadingCategorias.set(true);
    this.categoriaService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: cats => { this.categorias.set(cats); this.isLoadingCategorias.set(false); },
      error: ()  => { this.isLoadingCategorias.set(false); this.snackBar.open('Erro ao carregar categorias.', 'Fechar', { duration: 3000 }); },
    });
  }

  abrirDialogCategoria(categoria?: Categoria): void {
    const ref = this.dialog.open(CategoriaDialogComponent, { width: '480px', data: { categoria } });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (!res) return;
      if (categoria) {
        this.categorias.update(l => l.map(c => c.id === categoria.id ? res : c));
        this.snackBar.open('Categoria atualizada!', 'Fechar', { duration: 3000 });
      } else {
        this.categorias.update(l => [...l, res]);
        this.snackBar.open('Categoria criada!', 'Fechar', { duration: 3000 });
      }
    });
  }

  excluirCategoria(categoria: Categoria, event: Event): void {
    event.stopPropagation();
    const ref = this.snackBar.open(`Excluir "${categoria.nome}"?`, 'Confirmar', { duration: 5000 });
    ref.onAction().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.categoriaService.excluir(categoria.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: ()   => { this.categorias.update(l => l.filter(c => c.id !== categoria.id)); this.snackBar.open('Categoria excluída.', 'Fechar', { duration: 3000 }); },
        error: err => this.snackBar.open(err?.error?.message || 'Erro ao excluir.', 'Fechar', { duration: 3000 }),
      });
    });
  }

  // ── Mercados ──────────────────────────────────────────────────────────────
  carregarMercados(): void {
    this.isLoadingMercado.set(true);
    this.mercadoService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: lista => { this.mercados.set(lista); this.isLoadingMercado.set(false); },
      error: ()   => { this.isLoadingMercado.set(false); this.snackBar.open('Erro ao carregar mercados.', 'Fechar', { duration: 3000 }); },
    });
  }

  abrirMercadoDialog(mercado?: Mercado): void {
    const data: MercadoDialogData = { mercado };
    const ref = this.dialog.open(MercadoComponent, {
      width: '480px',
      data,
      panelClass: 'favly-dialog-panel',
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((res: Mercado | null) => {
      if (!res) return;
      if (mercado) {
        this.mercados.update(l => l.map(m => m.id === mercado.id ? res : m));
        this.snackBar.open('Mercado atualizado!', '', { duration: 2500 });
      } else {
        this.mercados.update(l => [...l, res]);
        this.snackBar.open('Mercado criado!', '', { duration: 2500 });
      }
    });
  }

  excluirMercado(mercado: Mercado, event: Event): void {
    event.stopPropagation();
    const ref = this.snackBar.open(`Excluir "${mercado.nome}"?`, 'Confirmar', { duration: 5000 });
    ref.onAction().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.mercadoService.excluir(mercado.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: ()   => { this.mercados.update(l => l.filter(m => m.id !== mercado.id)); this.snackBar.open('Mercado excluído.', 'Fechar', { duration: 3000 }); },
        error: err => this.snackBar.open(err?.error?.message || 'Erro ao excluir.', 'Fechar', { duration: 3000 }),
      });
    });
  }

  // ── Produtos ──────────────────────────────────────────────────────────────
  carregarProdutos(): void {
    this.isLoadingProdutos.set(true);
    this.produtoService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: lista => { this.produtos.set(lista); this.isLoadingProdutos.set(false); },
      error: ()   => { this.isLoadingProdutos.set(false); this.snackBar.open('Erro ao carregar produtos.', 'Fechar', { duration: 3000 }); },
    });
  }

  carregarBaixoEstoque(): void {
    this.isLoadingBaixoEstoque.set(true);
    this.produtoService.listarEstoqueBaixo().pipe(takeUntil(this.destroy$)).subscribe({
      next: lista => { this.produtosBaixoEstoque.set(lista); this.isLoadingBaixoEstoque.set(false); },
      error: ()   => this.isLoadingBaixoEstoque.set(false),
    });
  }

  abrirDrawerNovoProduto(): void {
    this.produtoEditando.set(null);
    this.drawerAberto.set(true);
  }

  abrirDrawerEditarProduto(produto: Produto, event: Event): void {
    event.stopPropagation();
    this.produtoEditando.set(produto);
    this.drawerAberto.set(true);
  }

  fecharDrawer(): void {
    this.drawerAberto.set(false);
    this.produtoEditando.set(null);
  }

  abrirDetalhe(produto: Produto): void {
    this.produtoSelecionadoId.set(produto.id);
  }

  fecharDetalhe(): void {
    this.produtoSelecionadoId.set(null);
  }

  abrirDrawerEditarProdutoDetalhe(produto: Produto): void {
    this.fecharDetalhe();
    this.produtoEditando.set(produto);
    this.drawerAberto.set(true);
  }

  onProdutoSalvo(produto: Produto): void {
    if (this.produtoEditando()) {
      this.produtos.update(l => l.map(p => p.id === produto.id ? produto : p));
      this.snackBar.open('Produto atualizado!', 'Fechar', { duration: 3000 });
    } else {
      this.produtos.update(l => [...l, produto]);
      this.snackBar.open('Produto cadastrado!', 'Fechar', { duration: 3000 });
    }
    this.fecharDrawer();
    this.carregarBaixoEstoque();
  }

  excluirProduto(produto: Produto, event: Event): void {
    event.stopPropagation();
    const ref = this.snackBar.open(`Excluir "${produto.nome}"?`, 'Confirmar', { duration: 5000 });
    ref.onAction().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.produtoService.excluir(produto.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: ()   => { this.produtos.update(l => l.filter(p => p.id !== produto.id)); this.carregarBaixoEstoque(); this.snackBar.open('Produto excluído.', 'Fechar', { duration: 3000 }); },
        error: err => this.snackBar.open(err?.error?.message || 'Erro ao excluir.', 'Fechar', { duration: 3000 }),
      });
    });
  }

  // ── Movimentações ─────────────────────────────────────────────────────────
  carregarMovimentacoes(): void {
    this.isLoadingMovimentacoes.set(true);
    this.movimentacaoService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: lista => { this.movimentacoes.set(lista); this.isLoadingMovimentacoes.set(false); },
      error: ()   => this.isLoadingMovimentacoes.set(false),
    });
  }

  registrarEntrada(produtoPreSelecionado?: { id: string; nome: string; unidade: number; quantidadeAtual: number }): void {
    const ref = this.dialog.open(EntradaDialogComponent, {
      width: '480px',
      data: {
        produtos: this.produtos().map(p => ({
          id: p.id, nome: p.nome, unidade: p.unidade, quantidadeAtual: p.quantidadeAtual,
        })),
        mercados: this.mercados().map(m => ({ id: m.id, nome: m.nome })),
        produtoPreSelecionado,
      },
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(ok => {
      if (ok) {
        this.snackBar.open('Entrada registrada!', 'Fechar', { duration: 3000 });
        this.carregarProdutos();
        this.carregarBaixoEstoque();
        this.carregarMovimentacoes();
      }
    });
  }

  registrarEntradaProduto(produto: Produto): void {
    this.registrarEntrada({ id: produto.id, nome: produto.nome, unidade: produto.unidade, quantidadeAtual: produto.quantidadeAtual });
  }

  registrarSaidaProduto(produto: Produto): void {
    const ref = this.dialog.open(SaidaDialogComponent, {
      width: '440px',
      panelClass: 'favly-dialog-panel',
      data: {
        produtos: this.produtos().map(p => ({
          id: p.id, nome: p.nome, unidade: p.unidade, quantidadeAtual: p.quantidadeAtual,
        })),
        produtoPreSelecionado: {
          id: produto.id, nome: produto.nome, unidade: produto.unidade, quantidadeAtual: produto.quantidadeAtual,
        },
      },
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(ok => {
      if (ok) {
        this.snackBar.open('Uso registrado!', '', { duration: 2500 });
        this.carregarProdutos();
        this.carregarBaixoEstoque();
        this.carregarMovimentacoes();
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getNomeCategoria(categoriaId: string): string {
    return this.categorias().find(c => c.id === categoriaId)?.nome ?? '—';
  }

  getUnidadeLabel(unidade: number): string {
    return UNIDADES.find(u => u.valor === unidade)?.sigla ?? 'un';
  }

  getNivelEstoque(produto: Produto): number {
    if (produto.quantidadeMinima === 0) return 100;
    return Math.min(100, Math.round((produto.quantidadeAtual / (produto.quantidadeMinima * 2)) * 100));
  }

  getAvatarColor(nome: string): string { return avatarColor(nome); }

  getCategoriaIcone(categoriaId: string): string {
    return this.categorias().find(c => c.id === categoriaId)?.icone ?? '▣';
  }

  /** Saudação baseada na hora atual */
  get saudacao(): string {
    const h = new Date().getHours();
    if (h < 12) return 'bom dia';
    if (h < 18) return 'boa tarde';
    return 'boa noite';
  }

  getMercadoNome(mercadoId: string): string {
    return this.mercados().find(m => m.id === mercadoId)?.nome ?? '';
  }

  readonly isEntrada = isEntrada;

  getCategoriaLabel(nomeCategoria: string): string {
    const cat = this.categorias().find(c => c.nome === nomeCategoria);
    return cat ? `${cat.icone} ${cat.nome}` : nomeCategoria;
  }

  setFiltroCategoria(cat: string): void { this.filtroCategoriaAtivo.set(cat); }
  setFiltroMarca(marca: string): void { this.filtroMarca.set(marca); }
  setSortBy(s: 'nome' | 'quantidade' | 'preco'): void { this.sortBy.set(s); }
  limparFiltros(): void {
    this.filtroCategoriaAtivo.set('todos');
    this.filtroMarca.set('');
    this.searchQuery.set('');
    this.sortBy.set('nome');
  }
  toggleDarkMode(): void { this.darkMode.update(v => !v); }
  logout(): void { this.authService.logout(); }
  voltarGrupos(): void { this.router.navigate(['/grupos']); }
  cadastrarProduto(): void { this.abrirDrawerNovoProduto(); }
  registrarSaida(): void {
    const ref = this.dialog.open(SaidaDialogComponent, {
      width: '440px',
      panelClass: 'favly-dialog-panel',
      data: {
        produtos: this.produtos().map(p => ({
          id: p.id, nome: p.nome, unidade: p.unidade, quantidadeAtual: p.quantidadeAtual,
        })),
      },
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(ok => {
      if (ok) {
        this.snackBar.open('Uso registrado!', '', { duration: 2500 });
        this.carregarProdutos();
        this.carregarBaixoEstoque();
        this.carregarMovimentacoes();
      }
    });
  }
  private safeLocalStorage(action: 'get' | 'set', key: string, value?: string): string | null {
    try {
      if (action === 'get') return localStorage.getItem(key);
      if (value !== undefined) localStorage.setItem(key, value);
      return null;
    } catch { return null; }
  }
}
