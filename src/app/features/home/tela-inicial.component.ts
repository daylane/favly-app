import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

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
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../core/services/auth.service';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface Categoria {
  id: number;
  nome: string;
  icone: string;
  totalProdutos: number;
}

export interface Produto {
  id: number;
  nome: string;
  categoria: string;
  unidade: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  precoUnitario: number;
  localizacao?: string;
}

export type TipoMovimentacao = 'entrada' | 'saida';

export interface Movimentacao {
  id: number;
  produtoId: number;
  produto: string;
  categoria: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  unidade: string;
  precoUnitario?: number;
  data: Date;
  observacao?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

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
  ],
  templateUrl: './tela-inicial.component.html',
  styleUrls: ['./tela-inicial.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {

  private router      = inject(Router);
  private authService = inject(AuthService);
  private snackBar    = inject(MatSnackBar);

  usuario = this.authService.getUsuario();

  darkMode = signal<boolean>(false);

  filtroCategoriaAtivo = signal<string>('todos');

  constructor() {
    // Lê preferência salva ou detecta preferência do sistema
    const saved = this.safeLocalStorage('get', 'favly-theme');
    const prefersDark = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
    this.darkMode.set(saved === 'dark' || (!saved && prefersDark));

    // Effect precisa estar no constructor para ter contexto de injeção
    effect(() => {
      const dark = this.darkMode();
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('favly-dark', dark);
      }
      this.safeLocalStorage('set', 'favly-theme', dark ? 'dark' : 'light');
    });
  }

  private safeLocalStorage(action: 'get' | 'set', key: string, value?: string): string | null {
    try {
      if (action === 'get') return localStorage.getItem(key);
      if (value !== undefined) localStorage.setItem(key, value);
      return null;
    } catch {
      return null;
    }
  }

  // ── Dados de exemplo ────────────────────────────────────────────────────────

  categorias = signal<Categoria[]>([
    { id: 1, nome: 'Alimentos',  icone: '🍛', totalProdutos: 54 },
    { id: 2, nome: 'Limpeza',    icone: '🧹', totalProdutos: 28 },
    { id: 3, nome: 'Higiene',    icone: '🪥', totalProdutos: 19 },
    { id: 4, nome: 'Bebidas',    icone: '🥤', totalProdutos: 12 },
    { id: 5, nome: 'Frios',      icone: '❄️', totalProdutos: 9  },
    { id: 6, nome: 'Hortifruti', icone: '🍅', totalProdutos: 8  },
    { id: 7, nome: 'Farmácia',   icone: '💊', totalProdutos: 7  },
  ]);

  produtos = signal<Produto[]>([
    { id: 1,  nome: 'Arroz Tio João 5kg',   categoria: 'Alimentos',  unidade: 'un', quantidadeAtual: 4,  quantidadeMinima: 2,  precoUnitario: 28.90 },
    { id: 2,  nome: 'Feijão carioca 1kg',   categoria: 'Alimentos',  unidade: 'un', quantidadeAtual: 2,  quantidadeMinima: 2,  precoUnitario: 8.50  },
    { id: 3,  nome: 'Azeite Gallo 500ml',   categoria: 'Alimentos',  unidade: 'un', quantidadeAtual: 1,  quantidadeMinima: 2,  precoUnitario: 22.90 },
    { id: 4,  nome: 'Sal refinado 1kg',     categoria: 'Alimentos',  unidade: 'un', quantidadeAtual: 1,  quantidadeMinima: 3,  precoUnitario: 3.49  },
    { id: 5,  nome: 'Leite integral 1L',    categoria: 'Bebidas',    unidade: 'un', quantidadeAtual: 2,  quantidadeMinima: 4,  precoUnitario: 6.90  },
    { id: 6,  nome: 'Detergente Ypê 500ml', categoria: 'Limpeza',    unidade: 'un', quantidadeAtual: 3,  quantidadeMinima: 2,  precoUnitario: 3.99  },
    { id: 7,  nome: 'Sabão em pó 1kg',      categoria: 'Limpeza',    unidade: 'cx', quantidadeAtual: 1,  quantidadeMinima: 1,  precoUnitario: 12.90 },
    { id: 8,  nome: 'Esponja de louça',     categoria: 'Limpeza',    unidade: 'un', quantidadeAtual: 2,  quantidadeMinima: 4,  precoUnitario: 2.50  },
    { id: 9,  nome: 'Shampoo Elseve 400ml', categoria: 'Higiene',    unidade: 'un', quantidadeAtual: 1,  quantidadeMinima: 2,  precoUnitario: 19.90 },
    { id: 10, nome: 'Papel higiênico 12un', categoria: 'Higiene',    unidade: 'pct', quantidadeAtual: 4, quantidadeMinima: 2,  precoUnitario: 24.90 },
    { id: 11, nome: 'Dipirona 500mg',       categoria: 'Farmácia',   unidade: 'cx', quantidadeAtual: 2,  quantidadeMinima: 1,  precoUnitario: 8.90  },
  ]);

  movimentacoes = signal<Movimentacao[]>([
    { id: 1, produtoId: 1, produto: 'Arroz Tio João 5kg',   categoria: 'Alimentos', tipo: 'entrada', quantidade: 2,  unidade: 'un',  data: new Date() },
    { id: 2, produtoId: 6, produto: 'Detergente Ypê 500ml', categoria: 'Limpeza',   tipo: 'saida',   quantidade: 1,  unidade: 'un',  data: new Date() },
    { id: 3, produtoId: 10, produto: 'Papel higiênico',     categoria: 'Higiene',   tipo: 'entrada', quantidade: 12, unidade: 'un',  data: new Date(Date.now() - 86400000) },
    { id: 4, produtoId: 7, produto: 'Sabão em pó 1kg',      categoria: 'Limpeza',   tipo: 'saida',   quantidade: 1,  unidade: 'cx',  data: new Date(Date.now() - 86400000) },
    { id: 5, produtoId: 5, produto: 'Feijão carioca 1kg',   categoria: 'Alimentos', tipo: 'entrada', quantidade: 3,  unidade: 'un',  data: new Date(Date.now() - 172800000) },
  ]);

  // ── Computed ────────────────────────────────────────────────────────────────

  totalCategorias = computed(() => this.categorias().length);

  totalProdutos = computed(() => this.produtos().length);

  valorTotalEstoque = computed(() =>
    this.produtos().reduce((acc, p) => acc + p.quantidadeAtual * p.precoUnitario, 0)
  );

  totalCriticos = computed(() =>
    this.produtos().filter(p => p.quantidadeAtual <= p.quantidadeMinima).length
  );

  produtosBaixoEstoque = computed(() =>
    this.produtos()
      .filter(p => p.quantidadeAtual <= p.quantidadeMinima * 1.5)
      .sort((a, b) => this.getNivelEstoque(a) - this.getNivelEstoque(b))
      .slice(0, 5)
  );

  movimentacoesRecentes = computed(() =>
    [...this.movimentacoes()]
      .sort((a, b) => b.data.getTime() - a.data.getTime())
      .slice(0, 5)
  );

  produtosFiltrados = computed(() => {
    const filtro = this.filtroCategoriaAtivo();
    if (filtro === 'todos') return this.produtos();
    return this.produtos().filter(p => p.categoria === filtro);
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnInit(): void {}

  ngOnDestroy(): void {
    document.body.classList.remove('favly-dark');
  }

  toggleDarkMode(): void {
    this.darkMode.update(v => !v);
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  setFiltroCategoria(categoria: string): void {
    this.filtroCategoriaAtivo.set(categoria);
  }

  getNivelEstoque(produto: Produto): number {
    if (produto.quantidadeMinima === 0) return 100;
    return Math.min(100, Math.round((produto.quantidadeAtual / (produto.quantidadeMinima * 2)) * 100));
  }

  cadastrarProduto(): void {
    this.snackBar.open('Em breve: cadastrar produto!', 'Ok', { duration: 2000 });
  }

  registrarEntrada(): void {
    this.snackBar.open('Em breve: registrar entrada!', 'Ok', { duration: 2000 });
  }

  registrarSaida(): void {
    this.snackBar.open('Em breve: registrar saída!', 'Ok', { duration: 2000 });
  }

  registrarCompra(): void {
    this.snackBar.open('Em breve: registrar compra com preço!', 'Ok', { duration: 2000 });
  }

  registrarEntradaProduto(produto: Produto): void {
    this.snackBar.open(`Entrada de "${produto.nome}"`, 'Ok', { duration: 2000 });
  }

  registrarSaidaProduto(produto: Produto): void {
    this.produtos.update(lista =>
      lista.map(p =>
        p.id === produto.id && p.quantidadeAtual > 0
          ? { ...p, quantidadeAtual: p.quantidadeAtual - 1 }
          : p
      )
    );
    this.movimentacoes.update(lista => [
      {
        id: lista.length + 1,
        produtoId: produto.id,
        produto: produto.nome,
        categoria: produto.categoria,
        tipo: 'saida',
        quantidade: 1,
        unidade: produto.unidade,
        data: new Date(),
      },
      ...lista,
    ]);
    this.snackBar.open(`Saída de "${produto.nome}" registrada!`, 'Desfazer', { duration: 3000 });
  }

  filtrarPorCategoria(categoria: Categoria): void {
    this.setFiltroCategoria(categoria.nome);
    const el = document.querySelector('.products-section');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  gerenciarCategorias(): void {
    this.snackBar.open('Em breve: gerenciar categorias!', 'Ok', { duration: 2000 });
  }

  novaCategorias(): void {
    this.snackBar.open('Em breve: nova categoria!', 'Ok', { duration: 2000 });
  }

  logout(): void {
    this.authService.logout();
  }
}