import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-esquecer-senha',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './esquecer-senha.component.html',
  styleUrls: ['./esquecer-senha.component.scss']
})
export class EsquecerSenhaComponent {

  private fb     = inject(FormBuilder);
  private router = inject(Router);
  private http   = inject(HttpClient);

  isLoading    = signal(false);
  errorMessage = signal('');
  enviado      = signal(false); // exibe tela de sucesso

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  get emailControl(): AbstractControl { return this.form.get('email')!; }

  get emailError(): string {
    const c = this.emailControl;
    if (c.invalid && c.touched) {
      if (c.hasError('required')) return 'E-mail é obrigatório.';
      if (c.hasError('email'))    return 'Informe um e-mail válido.';
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

    const body = { email: this.form.value.email };

    this.http.post(`${environment.apiUrl}/auth/esqueci-senha`, body)
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.enviado.set(true);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.message || 'Erro ao enviar e-mail. Tente novamente.');
        }
      });
  }

  irParaRedefinir(): void {
    this.router.navigate(['/auth/redefinir-senha']);
  }

  onVoltar(): void {
    this.router.navigate(['/auth/login']);
  }
}
