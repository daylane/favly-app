import { Component, OnInit, OnDestroy, inject, signal, computed, effect, PLATFORM_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';

import { AuthService } from '../../core/services/auth.service';
import { CategoriaService } from './Categoria/categoria.service';
import { Categoria } from './Categoria/categoria.model';
import { CategoriaDialogComponent } from './Categoria/Dialogs/categoria-dialog.component';
import { ProdutoService } from './Produto/produto.service';
import { Produto, UNIDADES } from './Produto/produto.model';
import { ProdutoDrawerComponent } from './Produto/Drawer/produto-drawer.component';
import { MovimentacaoService } from './Movimentacao/movimentacao.service';
import { EntradaDialogComponent } from './Movimentacao/Entrada/entrada-dialog.component';

export type TipoMovimentacao = 'entrada' | 'saida';

export interface Movimentacao {
  id: number;
  produtoId: string;
  produto: string;
  categoria: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  unidade: string;
  data: Date;
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

  private router = inject(Router);
  private authService = inject(AuthService);
  private categoriaService = inject(CategoriaService);
  private produtoService = inject(ProdutoService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();
  private platformId = inject(PLATFORM_ID);

  usuario = this.authService.getUsuario();

  darkMode = signal<boolean>(false);
  filtroCategoriaAtivo = signal<string>('todos');
  isLoadingCategorias = signal<boolean>(false);
  isLoadingProdutos = signal<boolean>(false);
  drawerAberto = signal<boolean>(false);
  produtoEditando = signal<Produto | null>(null);

  categorias = signal<Categoria[]>([]);
  produtos = signal<Produto[]>([]);
  movimentacoes = signal<Movimentacao[]>([
    { id: 1, produtoId: '1', produto: 'Arroz Tio João 5kg', categoria: 'Alimentos', tipo: 'entrada', quantidade: 2, unidade: 'un', data: new Date() },
    { id: 2, produtoId: '2', produto: 'Detergente Ypê 500ml', categoria: 'Limpeza', tipo: 'saida', quantidade: 1, unidade: 'un', data: new Date() },
  ]);

  // ── Computed ──────────────────────────────────────────────────────────────
  totalCategorias = computed(() => this.categorias().length);
  totalProdutos = computed(() => this.produtos().length);
  valorTotalEstoque = computed(() => this.produtos().reduce((acc, p) => acc + (p.ultimoPreco ?? 0) * p.quantidadeAtual, 0));
  totalCriticos = computed(() => this.produtos().filter(p => p.estoqueAbaixoDoMinimo).length);

  produtosBaixoEstoque = computed(() =>
    this.produtos()
      .filter(p => p.estoqueAbaixoDoMinimo)
      .sort((a, b) => this.getNivelEstoque(a) - this.getNivelEstoque(b))
      .slice(0, 5)
  );

  movimentacoesRecentes = computed(() =>
    [...this.movimentacoes()].sort((a, b) => b.data.getTime() - a.data.getTime()).slice(0, 5)
  );

  produtosFiltrados = computed(() => {
    const f = this.filtroCategoriaAtivo();
    return f === 'todos'
      ? this.produtos()
      : this.produtos().filter(p => p.categoriaId === this.categorias().find(c => c.nome === f)?.id);
  });

  // ── Constructor ───────────────────────────────────────────────────────────
  constructor() {
    const saved = this.safeLocalStorage('get', 'favly-theme');
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove('favly-dark');
    }
  }

  // ── Categorias ────────────────────────────────────────────────────────────
  carregarCategorias(): void {
    this.isLoadingCategorias.set(true);
    this.categoriaService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cats) => { this.categorias.set(cats); this.isLoadingCategorias.set(false); },
        error: () => { this.isLoadingCategorias.set(false); this.snackBar.open('Erro ao carregar categorias.', 'Fechar', { duration: 3000 }); }
      });
  }

  abrirDialogCategoria(categoria?: Categoria): void {
    const ref = this.dialog.open(CategoriaDialogComponent, { width: '480px', data: { categoria } });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(resultado => {
      if (!resultado) return;
      if (categoria) {
        this.categorias.update(lista => lista.map(c => c.id === categoria.id ? resultado : c));
        this.snackBar.open('Categoria atualizada!', 'Fechar', { duration: 3000 });
      } else {
        this.categorias.update(lista => [...lista, resultado]);
        this.snackBar.open('Categoria criada!', 'Fechar', { duration: 3000 });
      }
    });
  }

  excluirCategoria(categoria: Categoria, event: Event): void {
    event.stopPropagation();
    const snackRef = this.snackBar.open(`Excluir "${categoria.nome}"?`, 'Confirmar', { duration: 5000 });
    snackRef.onAction().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.categoriaService.excluir(categoria.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.categorias.update(lista => lista.filter(c => c.id !== categoria.id)); this.snackBar.open('Categoria excluída.', 'Fechar', { duration: 3000 }); },
        error: (err) => this.snackBar.open(err?.error?.message || 'Erro ao excluir categoria.', 'Fechar', { duration: 3000 })
      });
    });
  }

  // ── Produtos ──────────────────────────────────────────────────────────────
  carregarProdutos(): void {
    this.isLoadingProdutos.set(true);
    this.produtoService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lista) => { this.produtos.set(lista); this.isLoadingProdutos.set(false); },
        error: () => { this.isLoadingProdutos.set(false); this.snackBar.open('Erro ao carregar produtos.', 'Fechar', { duration: 3000 }); }
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
      this.produtos.update(lista => lista.map(p => p.id === produto.id ? produto : p));
      this.snackBar.open('Produto atualizado!', 'Fechar', { duration: 3000 });
    } else {
      this.produtos.update(lista => [...lista, produto]);
      this.snackBar.open('Produto cadastrado!', 'Fechar', { duration: 3000 });
    }
    this.fecharDrawer();
  }

  excluirProduto(produto: Produto, event: Event): void {
    event.stopPropagation();
    const snackRef = this.snackBar.open(`Excluir "${produto.nome}"?`, 'Confirmar', { duration: 5000 });
    snackRef.onAction().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.produtoService.excluir(produto.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.produtos.update(lista => lista.filter(p => p.id !== produto.id)); this.snackBar.open('Produto excluído.', 'Fechar', { duration: 3000 }); },
        error: (err) => this.snackBar.open(err?.error?.message || 'Erro ao excluir.', 'Fechar', { duration: 3000 })
      });
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

  setFiltroCategoria(categoria: string): void { this.filtroCategoriaAtivo.set(categoria); }

  filtrarPorCategoria(cat: Categoria): void {
    this.setFiltroCategoria(cat.nome);
    if (isPlatformBrowser(this.platformId)) {
      document.querySelector('.products-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  toggleDarkMode(): void { this.darkMode.update(v => !v); }

  cadastrarProduto(): void { this.abrirDrawerNovoProduto(); }
  registrarEntrada(produtoPreSelecionado?: any): void {
    const ref = this.dialog.open(EntradaDialogComponent, {
      width: '500px',
      data: {
        produtos: this.produtos().map(p => ({
          id: p.id,
          nome: p.nome,
          unidade: p.unidade
        })),
        produtoPreSelecionado
      }
    });

    ref.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmado => {
        if (confirmado) {
          this.snackBar.open('Entrada registrada!', 'Fechar', { duration: 3000 });
          this.carregarProdutos(); // recarrega para atualizar quantidades
        }
      });
  }
  registrarSaida(): void { this.snackBar.open('Em breve!', 'Ok', { duration: 2000 }); }
  registrarCompra(): void { this.snackBar.open('Em breve!', 'Ok', { duration: 2000 }); }
  registrarEntradaProduto(produto: Produto): void {
    this.registrarEntrada({ id: produto.id, nome: produto.nome, unidade: produto.unidade });
  }
  registrarSaidaProduto(produto: Produto): void { this.snackBar.open(`Saída de "${produto.nome}"`, 'Ok', { duration: 2000 }); }
  logout(): void { this.authService.logout(); }

  private safeLocalStorage(action: 'get' | 'set', key: string, value?: string): string | null {
    try {
      if (action === 'get') return localStorage.getItem(key);
      if (value !== undefined) localStorage.setItem(key, value);
      return null;
    } catch { return null; }
  }
}