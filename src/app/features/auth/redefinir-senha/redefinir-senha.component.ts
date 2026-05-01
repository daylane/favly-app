import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, Validators, ReactiveFormsModule,
  AbstractControl, ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { senhaForteValidator } from '../../../shared/validators/senha.validator';

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
export class RedefinirSenhaComponent implements OnInit {

  private fb          = inject(FormBuilder);
  private router      = inject(Router);
  private route       = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private snackBar    = inject(MatSnackBar);

  isLoading       = signal(false);
  errorMessage    = signal('');
  showNovaSenha   = signal(false);
  showConfirmacao = signal(false);

  form = this.fb.group({
    token:            ['', [Validators.required]],
    novaSenha:        ['', [Validators.required, Validators.minLength(8), senhaForteValidator]],
    confirmacaoSenha: ['', [Validators.required]],
  }, { validators: senhasIguaisValidator });

  get tokenControl():       AbstractControl { return this.form.get('token')!; }
  get novaSenhaControl():   AbstractControl { return this.form.get('novaSenha')!; }
  get confirmacaoControl(): AbstractControl { return this.form.get('confirmacaoSenha')!; }

  ngOnInit(): void {
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    if (tokenParam) {
      this.tokenControl.setValue(tokenParam);
    }
  }

  get tokenError(): string {
    const c = this.tokenControl;
    if (c.invalid && c.touched && c.hasError('required')) return 'Token é obrigatório.';
    return '';
  }

  get novaSenhaError(): string {
    const c = this.novaSenhaControl;
    if (c.invalid && c.touched) {
      if (c.hasError('required'))   return 'Nova senha é obrigatória.';
      if (c.hasError('minlength'))  return 'Mínimo de 8 caracteres.';
      if (c.hasError('senhaFraca')) return 'A senha precisa ter ao menos 1 letra maiúscula e 1 número.';
    }
    return '';
  }

  get confirmacaoError(): string {
    const c = this.confirmacaoControl;
    if (c.touched) {
      if (c.hasError('required'))                  return 'Confirmação é obrigatória.';
      if (this.form.hasError('senhasDivergentes')) return 'As senhas não coincidem.';
    }
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { token, novaSenha, confirmacaoSenha } = this.form.value;

    this.authService.redefinirSenha(token!, novaSenha!, confirmacaoSenha!)
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

  onVoltar(): void { this.router.navigate(['/auth/esquecer-senha']); }
}
