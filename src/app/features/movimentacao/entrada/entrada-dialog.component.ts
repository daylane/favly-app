import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MovimentacaoService }              from '../movimentacao.service';
import { EntradaDialogData, UNIDADES_MAP }  from '../movimentacao.model';
import { parseDecimal }                     from '../../../shared/utils/parse-decimal';

@Component({
  selector: 'app-entrada-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './entrada-dialog.component.html',
  styleUrls:  ['./entrada-dialog.component.scss'],
})
export class EntradaDialogComponent implements OnInit {

  private fb                  = inject(FormBuilder);
  private movimentacaoService = inject(MovimentacaoService);
  private dialogRef           = inject(MatDialogRef<EntradaDialogComponent>);
  readonly data               = inject<EntradaDialogData>(MAT_DIALOG_DATA);

  isLoading    = signal(false);
  errorMessage = signal('');

  readonly unidadesMap = UNIDADES_MAP;

  form = this.fb.group({
    produtoId:  ['',  Validators.required],
    quantidade: ['1', Validators.required],
    preco:      [''],
    mercadoId:  [''],
    observacao: ['',  Validators.maxLength(200)],
  });

  get produtoIdCtrl():  AbstractControl { return this.form.get('produtoId')!;  }
  get quantidadeCtrl(): AbstractControl { return this.form.get('quantidade')!; }
  get precoCtrl():      AbstractControl { return this.form.get('preco')!;      }

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

  ngOnInit(): void {
    if (this.data.produtoPreSelecionado) {
      this.form.patchValue({ produtoId: this.data.produtoPreSelecionado.id });
    }
  }

  onSalvar(): void {
    this.form.markAllAsTouched();
    const { produtoId, quantidade, preco, mercadoId, observacao } = this.form.value;

    const qtd   = parseDecimal(quantidade);
    const price = parseDecimal(preco);

    if (!produtoId || qtd <= 0) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const payload = {
      produtoId:  produtoId,
      quantidade: qtd,
      preco:      price,
      mercadoId:  mercadoId ?? '',
      observacao: observacao ?? '',
    };

    this.movimentacaoService.registrarEntrada(payload).subscribe({
      next:  ()    => this.dialogRef.close(true),
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Erro ao registrar entrada.');
      },
    });
  }

  onCancelar(): void { this.dialogRef.close(false); }
}
