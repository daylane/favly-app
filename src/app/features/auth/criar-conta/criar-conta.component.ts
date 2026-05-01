import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators, AbstractControl,
  ReactiveFormsModule, ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, switchMap, of, takeUntil } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { UsuarioService } from '../../../core/services/usuario.service';
import { senhaForteValidator } from '../../../shared/validators/senha.validator';

function senhasIguaisValidator(group: AbstractControl): ValidationErrors | null {
  const senha       = group.get('senha')?.value;
  const confirmacao = group.get('confirmacaoSenha')?.value;
  return senha && confirmacao && senha !== confirmacao
    ? { senhasDivergentes: true }
    : null;
}

@Component({
  selector: 'app-criar-conta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './criar-conta.component.html',
  styleUrls: ['./criar-conta.component.scss']
})
export class CriarContaComponent implements OnInit, OnDestroy {

  form!: FormGroup;
  isLoading       = false;
  showPassword    = false;
  showConfirmacao = false;
  errorMessage    = '';
  avatarPreview: string | null = null;
  avatarFile:    File | null   = null;

  private fb             = inject(FormBuilder);
  private router         = inject(Router);
  private usuarioService = inject(UsuarioService);
  private snackBar       = inject(MatSnackBar);
  private destroy$       = new Subject<void>();

  ngOnInit(): void {
    this.form = this.fb.group({
      nome:             ['', [Validators.required, Validators.minLength(3)]],
      email:            ['', [Validators.required, Validators.email]],
      senha:            ['', [Validators.required, Validators.minLength(8), senhaForteValidator]],
      confirmacaoSenha: ['', [Validators.required]],
    }, { validators: senhasIguaisValidator });
  }

  get nomeControl():        AbstractControl { return this.form.get('nome')!; }
  get emailControl():       AbstractControl { return this.form.get('email')!; }
  get senhaControl():       AbstractControl { return this.form.get('senha')!; }
  get confirmacaoControl(): AbstractControl { return this.form.get('confirmacaoSenha')!; }

  get nomeError(): string {
    const c = this.nomeControl;
    if (c.invalid && c.touched) {
      if (c.hasError('required'))  return 'Nome é obrigatório.';
      if (c.hasError('minlength')) return 'Mínimo de 3 caracteres.';
    }
    return '';
  }

  get emailError(): string {
    const c = this.emailControl;
    if (c.invalid && c.touched) {
      if (c.hasError('required')) return 'E-mail é obrigatório.';
      if (c.hasError('email'))    return 'Informe um e-mail válido.';
    }
    return '';
  }

  get senhaError(): string {
    const c = this.senhaControl;
    if (c.invalid && c.touched) {
      if (c.hasError('required'))   return 'Senha é obrigatória.';
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

  togglePasswordVisibility(): void    { this.showPassword    = !this.showPassword; }
  toggleConfirmacaoVisibility(): void { this.showConfirmacao = !this.showConfirmacao; }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.snackBar.open('A imagem deve ter no máximo 2MB.', 'Fechar', { duration: 3000 });
      return;
    }

    this.revokePreview();
    this.avatarFile    = file;
    this.avatarPreview = URL.createObjectURL(file);
  }

  removeAvatar(): void {
    this.revokePreview();
    this.avatarFile    = null;
    this.avatarPreview = null;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isLoading    = true;
    this.errorMessage = '';

    // Se houver arquivo, faz upload primeiro; senão emite string vazia
    const upload$ = this.avatarFile
      ? this.usuarioService.uploadAvatar(this.avatarFile)
      : of({ url: '' });

    upload$
      .pipe(
        switchMap(({ url }) => this.usuarioService.criar({
          nome:   this.form.value.nome,
          email:  this.form.value.email,
          senha:  this.form.value.senha,
          avatar: url,
        })),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Conta criada com sucesso!', 'Fechar', { duration: 3000 });
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message || 'Erro ao criar conta. Tente novamente.';
        },
      });
  }

  private revokePreview(): void {
    if (this.avatarPreview) URL.revokeObjectURL(this.avatarPreview);
  }

  onLogin(): void { this.router.navigate(['/auth/login']); }

  ngOnDestroy(): void {
    this.revokePreview();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
