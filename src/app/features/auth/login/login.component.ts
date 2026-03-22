import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
 
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
 
import { AuthService } from '../../../core/services/auth.service';
 
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
  isLoading = false;
  showPassword = false;
  errorMessage = '';
 
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();
 
  ngOnInit(): void {
    this.buildForm();
  }
 
  private buildForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
 
  get emailControl(): AbstractControl {
    return this.loginForm.get('email')!;
  }
 
  get passwordControl(): AbstractControl {
    return this.loginForm.get('senha')!;
  }
 
  get emailError(): string {
    const ctrl = this.emailControl;
    if (ctrl.invalid && ctrl.touched) {
      if (ctrl.hasError('required')) return 'E-mail é obrigatório.';
      if (ctrl.hasError('email')) return 'Informe um e-mail válido.';
    }
    return '';
  }
 
  get passwordError(): string {
    const ctrl = this.passwordControl;
    if (ctrl.invalid && ctrl.touched) {
      if (ctrl.hasError('required')) return 'Senha é obrigatória.';
      if (ctrl.hasError('minlength')) return 'A senha deve ter no mínimo 6 caracteres.';
    }
    return '';
  }
 
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
 
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
 
    this.isLoading = true;
    this.errorMessage = '';
 
    const { email, senha } = this.loginForm.value;
 
    this.authService.login({ email, senha })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.router.navigate(['/home']),
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message || 'Credenciais inválidas.';
        }
      });
  }
 
  onForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
 
  onActivateAccount(): void {
    this.router.navigate(['/auth/criar-conta']);
  }
 
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}