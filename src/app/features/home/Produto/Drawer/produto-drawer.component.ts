import { Component, OnInit, OnDestroy, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProdutoService } from '../produto.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Produto, UNIDADES } from '../produto.model';
import { Categoria } from '../../Categoria/categoria.model';

@Component({
  selector: 'app-produto-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './produto-drawer.component.html',
  styleUrls: ['./produto-drawer.component.scss'],
})
export class ProdutoDrawerComponent implements OnInit, OnDestroy {

  @Input() categorias: Categoria[] = [];
  @Input() produto?: Produto;
  @Output() salvo = new EventEmitter<Produto>();
  @Output() fechado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private produtoService = inject(ProdutoService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  isLoading = signal(false);
  errorMessage = signal('');

  readonly unidades = UNIDADES;

  /**
   * Indica modo edição.
   * DEVE ser getter — campos de classe são avaliados antes de @Input() ser
   * injetado, então "!!this.produto" como campo seria sempre false e impede
   * a análise estática do compilador AOT (erro -991010 no componente pai).
   */
  get isEdicao(): boolean {
    return !!this.produto;
  }

  form!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nome: [
        this.produto?.nome ?? '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
      ],
      marca: [
        this.produto?.marca ?? '',
        [Validators.maxLength(60)],
      ],
      categoriaId: [
        this.produto?.categoriaId ?? '',
        [Validators.required],
      ],
      unidade: [
        this.produto?.unidade ?? 1,
        [Validators.required],
      ],
      quantidadeMinima: [
        this.produto?.quantidadeMinima ?? 0,
        [Validators.required, Validators.min(0)],
      ],
    });
  }

  get nomeControl(): AbstractControl<string> { return this.form.get('nome')!; }
  get marcaControl(): AbstractControl { return this.form.get('marca')!; }
  get categoriaIdControl(): AbstractControl { return this.form.get('categoriaId')!; }
  get unidadeControl(): AbstractControl { return this.form.get('unidade')!; }
  get quantidadeMinimaControl(): AbstractControl { return this.form.get('quantidadeMinima')!; }

  get nomeError(): string {
    const c = this.nomeControl;
    if (c.invalid && c.touched) {
      if (c.hasError('required')) return 'Nome e obrigatorio.';
      if (c.hasError('minlength')) return 'Minimo de 2 caracteres.';
      if (c.hasError('maxlength')) return 'Maximo de 100 caracteres.';
    }
    return '';
  }

  get categoriaError(): string {
    const c = this.categoriaIdControl;
    if (c.invalid && c.touched && c.hasError('required')) return 'Selecione uma categoria.';
    return '';
  }

  get quantidadeMinimaError(): string {
    const c = this.quantidadeMinimaControl;
    if (c.invalid && c.touched) {
      if (c.hasError('required')) return 'Obrigatorio.';
      if (c.hasError('min')) return 'Valor minimo e 0.';
    }
    return '';
  }

  onSalvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { nome, marca, categoriaId, unidade, quantidadeMinima } = this.form.value;
    const grupoId = this.authService.getGrupoId() ?? '';

    const request$ = this.produto
      ? this.produtoService.editar(this.produto.id, { categoriaId, nome, unidade, quantidadeMinima, marca })
      : this.produtoService.criar({ grupoId, categoriaId, nome, unidade, quantidadeMinima, marca });

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (produto) => {
        this.isLoading.set(false);
        this.salvo.emit(produto);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Erro ao salvar produto.');
      },
    });
  }

  onFechar(): void {
    this.fechado.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}