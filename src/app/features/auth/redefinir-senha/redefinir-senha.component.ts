import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { environment } from '../../../../environments/environment';

// Validator: novaSenha === confirmacaoSenha
function senhasIguaisValidator(group: AbstractControl): ValidationErrors | null {
  const nova        = group.get('novaSenha')?.value;
  const confirmacao = group.get('confirmacaoSenha')?.value;
  return nova && confirmacao && nova !== confirmacao
    ? { senhasDivergentes: true }
    : null;
}

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './redefinir-senha.component.html',
  styleUrls: ['./redefinir-senha.component.scss']
})
export class RedefinirSenhaComponent {

  private fb       = inject(FormBuilder);
  private router   = inject(Router);
  private http     = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  isLoading       = signal(false);
  errorMessage    = signal('');
  showNovaSenha   = signal(false);
  showConfirmacao = signal(false);

  form = this.fb.group({
    token:            ['', [Validators.required]],
    novaSenha:        ['', [Validators.required, Validators.minLength(6)]],
    confirmacaoSenha: ['', [Validators.required]],
  }, { validators: senhasIguaisValidator });

  get tokenControl():       AbstractControl { return this.form.get('token')!; }
  get novaSenhaControl():   AbstractControl { return this.form.get('novaSenha')!; }
  get confirmacaoControl(): AbstractControl { return this.form.get('confirmacaoSenha')!; }

  get tokenError(): string {
    const c = this.tokenControl;
    if (c.invalid && c.touched && c.hasError('required')) return 'Token é obrigatório.';
    return '';
  }

  get novaSenhaError(): string {
    const c = this.novaSenhaControl;
    if (c.invalid && c.touched) {
      if (c.hasError('required'))  return 'Nova senha é obrigatória.';
      if (c.hasError('minlength')) return 'Mínimo de 6 caracteres.';
    }
    return '';
  }

  get confirmacaoError(): string {
    const c = this.confirmacaoControl;
    if (c.touched) {
      if (c.hasError('required')) return 'Confirmação é obrigatória.';
      if (this.form.hasError('senhasDivergentes')) return 'As senhas não coincidem.';
    }
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { token, novaSenha, confirmacaoSenha } = this.form.value;
    const body = { token, novaSenha, confirmacaoSenha };

    this.http.post(`${environment.apiUrl}/auth/redefinir-senha`, body)
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackBar.open('Senha redefinida com sucesso!', 'Fechar', { duration: 4000 });
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.message || 'Token inválido ou expirado.');
        }
      });
  }

  onVoltar(): void {
    this.router.navigate(['/auth/esquecer-senha']);
  }
}
