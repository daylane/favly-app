import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MovimentacaoService }           from '../movimentacao.service';
import { SaidaDialogData, UNIDADES_MAP } from '../movimentacao.model';
import { parseDecimal }                  from '../../../shared/utils/parse-decimal';

@Component({
  selector: 'app-saida-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './saida-dialog.component.html',
  styleUrls:   ['./saida-dialog.component.scss'],
})
export class SaidaDialogComponent implements OnInit {

  private fb                  = inject(FormBuilder);
  private movimentacaoService = inject(MovimentacaoService);
  private dialogRef           = inject(MatDialogRef<SaidaDialogComponent>);
  readonly data               = inject<SaidaDialogData>(MAT_DIALOG_DATA);

  isLoading    = signal(false);
  errorMessage = signal('');

  readonly unidadesMap = UNIDADES_MAP;

  form = this.fb.group({
    produtoId:  ['',  Validators.required],
    quantidade: ['1', Validators.required],
  });

  get produtoIdCtrl():  AbstractControl { return this.form.get('produtoId')!;  }
  get quantidadeCtrl(): AbstractControl { return this.form.get('quantidade')!; }

  get produtoSelecionado() {
    return this.data.produtos.find(p => p.id === this.produtoIdCtrl.value) ?? null;
  }

  get unidade(): string {
    const p = this.produtoSelecionado;
    return p ? (this.unidadesMap[p.unidade] ?? 'un') : '';
  }

  get produtoError(): string {
    const c = this.produtoIdCtrl;
    return c.invalid && c.touched ? 'Selecione um produto.' : '';
  }

  get quantidadeError(): string {
    const c = this.quantidadeCtrl;
    if (!c.touched) return '';
    const val = parseDecimal(c.value);
    if (!c.value) return 'Obrigatório.';
    if (isNaN(val) || val <= 0) return 'Informe uma quantidade válida (ex: 1,5).';
    return '';
  }

  /** Avisa se a quantidade a dar baixa supera o estoque atual */
  get estoqueInsuficiente(): boolean {
    const p   = this.produtoSelecionado;
    const qtd = parseDecimal(this.quantidadeCtrl.value);
    return !!p && qtd > p.quantidadeAtual;
  }

  ngOnInit(): void {
    if (this.data.produtoPreSelecionado) {
      this.form.patchValue({ produtoId: this.data.produtoPreSelecionado.id });
    }
  }

  onSalvar(): void {
    this.form.markAllAsTouched();
    const { produtoId, quantidade } = this.form.value;
    const qtd = parseDecimal(quantidade);

    if (!produtoId || qtd <= 0) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.movimentacaoService.registrarSaida({
      produtoId:  produtoId,
      quantidade: qtd,
    }).subscribe({
      next:  ()    => this.dialogRef.close(true),
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Erro ao registrar saída.');
      },
    });
  }

  onCancelar(): void { this.dialogRef.close(false); }
}
