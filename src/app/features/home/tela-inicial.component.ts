import {
  Component, OnInit, OnDestroy,
  inject, signal, computed, effect, PLATFORM_ID,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';

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
import { CategoriaService }         from './Categoria/categoria.service';
import { Categoria }                from './Categoria/categoria.model';
import { CategoriaDialogComponent } from './Categoria/Dialogs/categoria-dialog.component';
import { ProdutoService }           from './Produto/produto.service';
import { Produto, UNIDADES }        from './Produto/produto.model';
import { ProdutoDrawerComponent }   from './Produto/Drawer/produto-drawer.component';
import { MovimentacaoService }      from './Movimentacao/movimentacao.service';
import { MovimentacaoItem }         from './Movimentacao/movimentacao.model';
import { EntradaDialogComponent }   from './Movimentacao/Entrada/entrada-dialog.component';
import { MembroService }            from './Membro/membro.service';
import { Membro }                   from './Membro/membro.model';
import { GrupoService }             from './Grupo/grupo.service';
import { ConvidarDialogComponent }  from './Membro/Convidar/convidar-dialog.component';
import { ConviteService }           from './Convite/convite.service';
import { Convite }                  from './Convite/convite.model';

export type TabType      = 'inicio' | 'despensa' | 'relatorio' | 'membros' | 'mais';
export type MaisTelaType = 'categorias' | null;

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
  ],
  templateUrl: './tela-inicial.component.html',
  styleUrls: ['./tela-inicial.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {

  private router              = inject(Router);
  private authService         = inject(AuthService);
  private categoriaService    = inject(CategoriaService);
  private produtoService      = inject(ProdutoService);
  private movimentacaoService = inject(MovimentacaoService);
  private membroService       = inject(MembroService);
  private grupoService        = inject(GrupoService);
  private conviteService      = inject(ConviteService);
  private dialog              = inject(MatDialog);
  private snackBar            = inject(MatSnackBar);
  private clipboard           = inject(Clipboard);
  private destroy$            = new Subject<void>();
  private platformId          = inject(PLATFORM_ID);

  usuario   = this.authService.getUsuario();
  grupoNome = this.authService.getGrupoNome();

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
  isLoadingMembros       = signal(false);
  isLoadingGrupo         = signal(false);
  isLoadingConvites      = signal(false);

  // ── Dados ─────────────────────────────────────────────────────────────────
  categorias           = signal<Categoria[]>([]);
  produtos             = signal<Produto[]>([]);
  produtosBaixoEstoque = signal<Produto[]>([]);
  movimentacoes        = signal<MovimentacaoItem[]>([]);
  membros              = signal<Membro[]>([]);
  grupoCodigo          = signal<string>('');
  convites             = signal<Convite[]>([]);

  // ── UI ────────────────────────────────────────────────────────────────────
  filtroCategoriaAtivo = signal<string>('todos');
  searchQuery          = signal<string>('');
  sortBy               = signal<'nome' | 'quantidade' | 'preco'>('nome');
  drawerAberto         = signal(false);
  produtoEditando      = signal<Produto | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  totalCategorias   = computed(() => this.categorias().length);
  totalProdutos     = computed(() => this.produtos().length);
  totalCriticos     = computed(() => this.produtosBaixoEstoque().length);
  valorTotalEstoque = computed(() =>
    this.produtos().reduce((acc, p) => acc + (p.ultimoPreco ?? 0) * p.quantidadeAtual, 0),
  );

  movimentacoesRecentes = computed(() => this.movimentacoes().slice(0, 5));

  produtosFiltrados = computed(() => {
    let lista = this.produtos();
    const f = this.filtroCategoriaAtivo();
    if (f !== 'todos') {
      const catId = this.categorias().find(c => c.nome === f)?.id;
      if (catId) lista = lista.filter(p => p.categoriaId === catId);
    }
    const q = this.searchQuery().toLowerCase().trim();
    if (q) lista = lista.filter(p => p.nome.toLowerCase().includes(q));
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
    if (t === 'membros' && this.membros().length === 0) {
      this.carregarMembros();
      this.carregarGrupoCodigo();
      this.carregarConvites();
    }
  }

  abrirSubtela(tela: 'categorias'): void { this.maisTela.set(tela); }
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

  registrarEntrada(produtoPreSelecionado?: { id: string; nome: string; unidade: number }): void {
    const ref = this.dialog.open(EntradaDialogComponent, {
      width: '500px',
      data: {
        produtos: this.produtos().map(p => ({ id: p.id, nome: p.nome, unidade: p.unidade })),
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
    this.registrarEntrada({ id: produto.id, nome: produto.nome, unidade: produto.unidade });
  }

  // ── Membros ───────────────────────────────────────────────────────────────
  carregarMembros(): void {
    this.isLoadingMembros.set(true);
    this.membroService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: lista => { this.membros.set(lista); this.isLoadingMembros.set(false); },
      error: ()   => this.isLoadingMembros.set(false),
    });
  }

  carregarGrupoCodigo(): void {
    if (this.grupoCodigo()) return; // já carregado
    this.isLoadingGrupo.set(true);
    this.grupoService.buscarDetalhes().pipe(takeUntil(this.destroy$)).subscribe({
      next: grupo => { this.grupoCodigo.set(grupo.codigo); this.isLoadingGrupo.set(false); },
      error: ()   => this.isLoadingGrupo.set(false),
    });
  }

  carregarConvites(): void {
    this.isLoadingConvites.set(true);
    this.conviteService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: lista => { this.convites.set(lista); this.isLoadingConvites.set(false); },
      error: ()   => this.isLoadingConvites.set(false),
    });
  }

  convitesPendentes = computed(() =>
    this.convites().filter(c => c.status?.toLowerCase() === 'pendente'),
  );

  abrirConvidarDialog(): void {
    const ref = this.dialog.open(ConvidarDialogComponent, {
      width: '420px',
      panelClass: 'convidar-panel',
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(ok => {
      if (ok) {
        this.snackBar.open('Convite enviado!', 'Fechar', { duration: 3000 });
        this.carregarConvites(); // refresh list
      }
    });
  }

  removerMembro(membro: Membro): void {
    const ref = this.snackBar.open(`Remover "${membro.nome}" do grupo?`, 'Confirmar', { duration: 5000 });
    ref.onAction().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.membroService.remover(membro.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: ()   => { this.membros.update(l => l.filter(m => m.id !== membro.id)); this.snackBar.open('Membro removido.', 'Fechar', { duration: 3000 }); },
        error: err => this.snackBar.open(err?.error?.message || 'Erro ao remover.', 'Fechar', { duration: 3000 }),
      });
    });
  }

  copiarCodigo(): void {
    const code = this.grupoCodigo();
    if (!code) return;
    this.clipboard.copy(code);
    this.snackBar.open('Código copiado!', '', { duration: 2000 });
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

  isCurrentUser(membro: Membro): boolean {
    return membro.isCurrentUser === true || membro.email === this.usuario?.email;
  }

  setFiltroCategoria(cat: string): void { this.filtroCategoriaAtivo.set(cat); }
  setSortBy(s: 'nome' | 'quantidade' | 'preco'): void { this.sortBy.set(s); }
  toggleDarkMode(): void { this.darkMode.update(v => !v); }
  logout(): void { this.authService.logout(); }

  private safeLocalStorage(action: 'get' | 'set', key: string, value?: string): string | null {
    try {
      if (action === 'get') return localStorage.getItem(key);
      if (value !== undefined) localStorage.setItem(key, value);
      return null;
    } catch { return null; }
  }
}
