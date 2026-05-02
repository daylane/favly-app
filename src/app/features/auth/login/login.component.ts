import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, FormControl,
  Validators, AbstractControl, ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { UsuarioService } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm!: FormGroup;
  codigoControl = new FormControl('', [Validators.required, Validators.minLength(4)]);

  isLoading       = false;
  showPassword    = false;
  errorMessage    = '';
  contaNaoAtivada = false;

  isActivating    = false;
  ativacaoError   = '';
  isResending     = false;
  reenvioCountdown = 0;

  private fb             = inject(FormBuilder);
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private authService    = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private destroy$       = new Subject<void>();
  private countdownRef: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get emailControl(): AbstractControl  { return this.loginForm.get('email')!; }
  get senhaControl(): AbstractControl  { return this.loginForm.get('senha')!; }

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
      if (c.hasError('minlength')) return 'A senha deve ter no mínimo 6 caracteres.';
    }
    return '';
  }

  get codigoError(): string {
    const c = this.codigoControl;
    if (c.invalid && c.touched) {
      if (c.hasError('required'))  return 'Informe o código de ativação.';
      if (c.hasError('minlength')) return 'Código inválido.';
    }
    return '';
  }

  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }

  onSubmit(): void {
    if (this.contaNaoAtivada) { this.onAtivar(); return; }

    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, senha } = this.loginForm.value;
    this.authService.login({ email, senha })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/grupos';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.isLoading = false;
          const msg: string = err?.error?.message || '';

          if (msg.toLowerCase().includes('ativ') || err?.status === 403) {
            this.errorMessage = msg || 'Conta não ativada. Verifique seu e-mail.';
            this.contaNaoAtivada = true;
          } else {
            this.errorMessage = msg || 'Credenciais inválidas.';
          }
        }
      });
  }

  onAtivar(): void {
    this.codigoControl.markAsTouched();
    if (this.codigoControl.invalid) return;

    this.isActivating = true;
    this.ativacaoError = '';

    const email = this.loginForm.value.email;

    this.usuarioService.ativar(email, this.codigoControl.value!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.contaNaoAtivada = false;
          this.errorMessage    = '';
          this.codigoControl.reset();
          this.clearCountdown();
          this.autoLogin();
        },
        error: (err) => {
          this.isActivating = false;
          this.ativacaoError = err?.error?.message || 'Código inválido ou expirado.';
        }
      });
  }

  private autoLogin(): void {
    const { email, senha } = this.loginForm.value;
    this.authService.login({ email, senha })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isActivating = false;
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/grupos';
          this.router.navigateByUrl(returnUrl);
        },
        error: () => {
          this.isActivating = false;
        }
      });
  }

  onReenviar(): void {
    if (this.reenvioCountdown > 0 || this.isResending) return;

    this.isResending = true;
    this.ativacaoError = '';

    this.usuarioService.reenviarAtivacao(this.loginForm.value.email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isResending = false;
          this.iniciarCountdown(60);
        },
        error: (err) => {
          this.isResending = false;
          this.ativacaoError = err?.error?.message || 'Erro ao reenviar. Tente novamente.';
        }
      });
  }

  private iniciarCountdown(s: number): void {
    this.reenvioCountdown = s;
    this.clearCountdown();
    this.countdownRef = setInterval(() => {
      if (this.reenvioCountdown <= 1) { this.reenvioCountdown = 0; this.clearCountdown(); }
      else this.reenvioCountdown--;
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownRef) { clearInterval(this.countdownRef); this.countdownRef = null; }
  }

  onForgotPassword(): void { this.router.navigate(['/auth/esquecer-senha']); }
  onCreateAccount(): void  { this.router.navigate(['/auth/criar-conta']); }

  ngOnDestroy(): void {
    this.clearCountdown();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
