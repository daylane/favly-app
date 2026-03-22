import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-criar-conta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
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
  isLoading = false;
  showPassword = false;
  errorMessage = '';
  avatarPreview: string | null = null;
  avatarBase64: string | null = null;

  private fb      = inject(FormBuilder);
  private router  = inject(Router);
  private http    = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nome:  ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get nomeControl():  AbstractControl { return this.form.get('nome')!; }
  get emailControl(): AbstractControl { return this.form.get('email')!; }
  get senhaControl(): AbstractControl { return this.form.get('senha')!; }

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
      if (c.hasError('required'))  return 'Senha é obrigatória.';
      if (c.hasError('minlength')) return 'Mínimo de 6 caracteres.';
    }
    return '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.snackBar.open('A imagem deve ter no máximo 2MB.', 'Fechar', { duration: 3000 });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview = reader.result as string;
      this.avatarBase64  = (reader.result as string).split(',')[1];
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.avatarPreview = null;
    this.avatarBase64  = null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      nome:   this.form.value.nome,
      email:  this.form.value.email,
      senha:  this.form.value.senha,
      avatar: this.avatarBase64 ?? ''
    };

    this.http.post(`${environment.apiUrl}/usuarios`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Conta criada com sucesso!', 'Fechar', { duration: 3000 });
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message || 'Erro ao criar conta. Tente novamente.';
        }
      });
  }

  onLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}