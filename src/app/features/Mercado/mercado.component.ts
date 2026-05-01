import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Mercado } from './services/mercado.model';
import { MercadoService } from './services/mercado.service';

export interface MercadoDialogData {
  mercado?: Mercado;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './mercado.component.html',
  styleUrls: ['./mercado.component.scss'],
})
export class MercadoComponent {

  private fb             = inject(FormBuilder);
  private mercadoService = inject(MercadoService);
  private dialogRef      = inject(MatDialogRef<MercadoComponent>);
  data                   = inject<MercadoDialogData>(MAT_DIALOG_DATA);

  readonly isEdicao = !!this.data?.mercado;

  isLoading    = signal(false);
  errorMessage = signal('');

  form = this.fb.group({
    nome:     [this.data?.mercado?.nome     ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    endereco: [this.data?.mercado?.endereco ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
  });

  get nomeControl():     AbstractControl { return this.form.get('nome')!; }
  get enderecoControl(): AbstractControl { return this.form.get('endereco')!; }

  get nomeError(): string {
    const c = this.nomeControl;
    if (c.invalid && c.touched) {
      if (c.hasError('required'))   return 'Nome é obrigatório.';
      if (c.hasError('minlength'))  return 'Mínimo de 2 caracteres.';
      if (c.hasError('maxlength'))  return 'Máximo de 60 caracteres.';
    }
    return '';
  }

  get enderecoError(): string {
    const c = this.enderecoControl;
    if (c.invalid && c.touched) {
      if (c.hasError('required'))   return 'Endereço é obrigatório.';
      if (c.hasError('minlength'))  return 'Mínimo de 2 caracteres.';
      if (c.hasError('maxlength'))  return 'Máximo de 120 caracteres.';
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

    const payload = {
      nome:     this.form.value.nome!.trim(),
      endereco: this.form.value.endereco!.trim(),
    };

    const req$ = this.isEdicao
      ? this.mercadoService.editar(this.data.mercado!.id, payload)
      : this.mercadoService.criar(payload);

    req$.subscribe({
      next:  mercado => this.dialogRef.close(mercado),
      error: err => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Erro ao salvar mercado.');
      },
    });
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
