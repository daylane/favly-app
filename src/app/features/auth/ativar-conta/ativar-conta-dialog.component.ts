import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { environment } from '../../../../environments/environment';

export interface AtivarContaDialogData {
  email: string;
}

@Component({
  selector: 'app-ativar-conta-dialog',
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
    MatSnackBarModule,
  ],
  templateUrl: './ativar-conta-dialog.component.html',
  styleUrls: ['./ativar-conta-dialog.component.scss']
})
export class AtivarContaDialogComponent {

  private fb        = inject(FormBuilder);
  private http      = inject(HttpClient);
  private snackBar  = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<AtivarContaDialogComponent>);
  data = inject<AtivarContaDialogData>(MAT_DIALOG_DATA);

  isLoading        = signal(false);
  isResending      = signal(false);
  errorMessage     = signal('');
  reenvioCountdown = signal(0); // segundos restantes para reenviar

  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  form = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(4)]]
  });

  get codigoControl() { return this.form.get('codigo')!; }

  get codigoError(): string {
    const c = this.codigoControl;
    if (c.invalid && c.touched) {
      if (c.hasError('required'))  return 'Código é obrigatório.';
      if (c.hasError('minlength')) return 'Código inválido.';
    }
    return '';
  }

  onConfirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const body = { codigo: this.codigoControl.value };

    this.http.post(`${environment.apiUrl}/usuarios/${this.data.email}/ativar`, body)
      .subscribe({
        next: () => {
          this.snackBar.open('Conta ativada com sucesso! Faça login.', 'Fechar', { duration: 4000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.message || 'Código inválido ou expirado.');
        }
      });
  }

  onReenviar(): void {
    if (this.reenvioCountdown() > 0 || this.isResending()) return;

    this.isResending.set(true);
    this.errorMessage.set('');

    this.http.post(`${environment.apiUrl}/usuarios/reenviar-ativacao`, { email: this.data.email })
      .subscribe({
        next: () => {
          this.isResending.set(false);
          this.snackBar.open('Código reenviado! Verifique seu e-mail.', 'Fechar', { duration: 4000 });
          this.iniciarCountdown(60);
        },
        error: (err) => {
          this.isResending.set(false);
          this.errorMessage.set(err?.error?.message || 'Erro ao reenviar código. Tente novamente.');
        }
      });
  }

  private iniciarCountdown(segundos: number): void {
    this.reenvioCountdown.set(segundos);
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    this.countdownInterval = setInterval(() => {
      const atual = this.reenvioCountdown();
      if (atual <= 1) {
        this.reenvioCountdown.set(0);
        clearInterval(this.countdownInterval!);
      } else {
        this.reenvioCountdown.set(atual - 1);
      }
    }, 1000);
  }

  onCancelar(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.dialogRef.close(false);
  }
}