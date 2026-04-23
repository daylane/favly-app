import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MovimentacaoService } from '../movimentacao.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EntradaDialogData, UNIDADES_MAP } from '../movimentacao.model';

@Component({
  selector: 'app-entrada-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './entrada-dialog.component.html',
  styleUrls: ['./entrada-dialog.component.scss']
})
export class EntradaDialogComponent implements OnInit {

  private fb                  = inject(FormBuilder);
  private movimentacaoService = inject(MovimentacaoService);
  private authService         = inject(AuthService);
  private dialogRef           = inject(MatDialogRef<EntradaDialogComponent>);
  data = inject<EntradaDialogData>(MAT_DIALOG_DATA);

  isLoading    = signal(false);
  errorMessage = signal('');

  readonly unidadesMap = UNIDADES_MAP;

  form = this.fb.group({
    produtoId:   ['', [Validators.required]],
    quantidade:  [1,  [Validators.required, Validators.min(1)]],
    preco:       [0,  [Validators.required, Validators.min(0)]],
    mercadoId:   [''],
    observacao:  ['', [Validators.maxLength(200)]],
  });

  get produtoIdControl():  AbstractControl { return this.form.get('produtoId')!; }
  get quantidadeControl(): AbstractControl { return this.form.get('quantidade')!; }
  get precoControl():      AbstractControl { return this.form.get('preco')!; }

  get produtoSelecionado() {
    const id = this.produtoIdControl.value;
    return this.data.produtos.find(p => p.id === id);
  }

  get produtoError(): string {
    const c = this.produtoIdControl;
    if (c.invalid && c.touched && c.hasError('required')) return 'Selecione um produto.';
    return '';
  }

  get quantidadeError(): string {
    const c = this.quantidadeControl;
    if (c.invalid && c.touched) {
      if (c.hasError('required')) return 'Obrigatório.';
      if (c.hasError('min'))      return 'Mínimo 1.';
    }
    return '';
  }

  ngOnInit(): void {
    if (this.data.produtoPreSelecionado) {
      this.form.patchValue({ produtoId: this.data.produtoPreSelecionado.id });
    }
  }

  onSalvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const membroId = this.authService.getUserId() ?? '';
    const { produtoId, quantidade, preco, mercadoId, observacao } = this.form.value;

    const payload = {
      produtoId:   produtoId!,
      membroId,
      quantidade:  quantidade!,
      preco:       preco!,
      mercadoId:   mercadoId ?? '',
      observacao:  observacao ?? '',
    };

    this.movimentacaoService.registrarEntrada(payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Erro ao registrar entrada.');
      }
    });
  }

  onCancelar(): void {
    this.dialogRef.close(false);
  }
}