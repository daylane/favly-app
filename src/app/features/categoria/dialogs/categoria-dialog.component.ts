import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

import { CategoriaService } from '../categoria.service';
import { Categoria } from '../categoria.model';

export interface CategoriaDialogData {
  categoria?: Categoria; // se vier, é edição; senão é criação
}

const EMOJIS = [
  '🍛','🍞','🥩','🐟','🧃','🥤','🍺','☕',
  '🧹','🧴','🧼','🪣','🫧','🧻','🧽','🪥',
  '💊','🩺','🌡️','💉','🩹','🧬','❄️','🥦',
  '🍅','🌽','🫙','🥫','🛒','📦','🏷️','⚡',
];

@Component({
  selector: 'app-categoria-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatRippleModule,
  ],
  templateUrl: './categoria-dialog.component.html',
  styleUrls: ['./categoria-dialog.component.scss']
})
export class CategoriaDialogComponent implements OnInit {

  private fb             = inject(FormBuilder);
  private categoriaService = inject(CategoriaService);
  private dialogRef      = inject(MatDialogRef<CategoriaDialogComponent>);
  data = inject<CategoriaDialogData>(MAT_DIALOG_DATA);

  isLoading    = signal(false);
  errorMessage = signal('');
  emojiSelecionado = signal('📦');

  readonly emojis = EMOJIS;
  readonly isEdicao = !!this.data?.categoria;

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
  });

  get nomeControl(): AbstractControl { return this.form.get('nome')!; }

  get nomeError(): string {
    const c = this.nomeControl;
    if (c.invalid && c.touched) {
      if (c.hasError('required'))   return 'Nome é obrigatório.';
      if (c.hasError('minlength'))  return 'Mínimo de 2 caracteres.';
      if (c.hasError('maxlength'))  return 'Máximo de 40 caracteres.';
    }
    return '';
  }

  ngOnInit(): void {
    if (this.isEdicao && this.data.categoria) {
      this.form.patchValue({ nome: this.data.categoria.nome });
      this.emojiSelecionado.set(this.data.categoria.icone ?? '📦');
    }
  }

  selecionarEmoji(emoji: string): void {
    this.emojiSelecionado.set(emoji);
  }

  onSalvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const payload = {
      nome:  this.form.value.nome!,
      icone: this.emojiSelecionado(),
    };

    const request$ = this.isEdicao
      ? this.categoriaService.editar(this.data.categoria!.id, payload)
      : this.categoriaService.criar(payload);

    request$.subscribe({
      next: (categoria) => this.dialogRef.close(categoria),
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Erro ao salvar categoria.');
      }
    });
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}