import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { MatIconModule }      from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService }   from '../../core/services/auth.service';
import { ConviteService } from '../home/Convite/convite.service';
import { ConviteInfo }   from '../home/Convite/convite.model';

export type ConviteEstado =
  | 'carregando'
  | 'novo-usuario'
  | 'login'
  | 'logado'
  | 'erro'
  | 'sucesso';

const senhasIguaisValidator: ValidatorFn = (fg): ValidationErrors | null => {
  const s = fg.get('senha')?.value;
  const c = fg.get('confirmarSenha')?.value;
  return s && c && s !== c ? { senhasDiferentes: true } : null;
};

@Component({
  selector: 'app-convite-aceite',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './convite-aceite.component.html',
  styleUrls:  ['./convite-aceite.component.scss'],
})
export class ConviteAceiteComponent implements OnInit, OnDestroy {

  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private fb             = inject(FormBuilder);
  private authService    = inject(AuthService);
  private conviteService = inject(ConviteService);
  private destroy$       = new Subject<void>();

  codigo       = '';
  estado       = signal<ConviteEstado>('carregando');
  conviteInfo  = signal<ConviteInfo | null>(null);
  erroMsg      = signal('');
  isLoading    = signal(false);
  showSenha    = signal(false);
  showConfirm  = signal(false);
  showLoginPwd = signal(false);

  // ── Formulário: novo usuário ──────────────────────────────────────────────
  formNovo = this.fb.group({
    nome:            ['', [Validators.required, Validators.minLength(2)]],
    apelido:         ['', [Validators.required, Validators.minLength(2)]],
    senha:           ['', [Validators.required, Validators.minLength(6)]],
    confirmarSenha:  ['', Validators.required],
  }, { validators: senhasIguaisValidator });

  // ── Formulário: login (usuário existente não logado) ──────────────────────
  formLogin = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  // ── Helpers para erros ────────────────────────────────────────────────────
  private err(form: 'novo' | 'login', field: string): string {
    const c = (form === 'novo' ? this.formNovo : this.formLogin).get(field)!;
    if (!c.invalid || !c.touched) return '';
    if (c.hasError('required'))   return 'Campo obrigatório.';
    if (c.hasError('minlength'))  return `Mínimo ${c.errors?.['minlength']?.requiredLength} caracteres.`;
    if (c.hasError('email'))      return 'E-mail inválido.';
    return '';
  }

  get erroNome():           string { return this.err('novo', 'nome'); }
  get erroApelido():        string { return this.err('novo', 'apelido'); }
  get erroSenhaNova():      string { return this.err('novo', 'senha'); }
  get erroConfirmarSenha(): string {
    const c = this.formNovo.get('confirmarSenha')!;
    if (!c.touched) return '';
    if (c.hasError('required')) return 'Campo obrigatório.';
    if (this.formNovo.hasError('senhasDiferentes')) return 'As senhas não coincidem.';
    return '';
  }
  get erroEmailLogin(): string { return this.err('login', 'email'); }
  get erroSenhaLogin(): string { return this.err('login', 'senha'); }

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.codigo = this.route.snapshot.paramMap.get('codigo') ?? '';

    if (!this.codigo) {
      this.estado.set('erro');
      this.erroMsg.set('Código de convite inválido.');
      return;
    }

    // Pré-preenche e-mail no formulário de login (se vier no conviteInfo)
    this.conviteService.buscarPorCodigo(this.codigo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: info => {
          this.conviteInfo.set(info);
          if (info.usuarioJaCadastrado) {
            // Pré-preenche o e-mail no form de login
            this.formLogin.patchValue({ email: info.emailConvidado });
            this.estado.set(
              this.authService.isAuthenticated() ? 'logado' : 'login',
            );
          } else {
            this.estado.set('novo-usuario');
          }
        },
        error: err => {
          this.estado.set('erro');
          this.erroMsg.set(
            err?.error?.message || 'Convite inválido ou expirado.',
          );
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Caso 1: novo usuário — registrar-e-aceitar ────────────────────────────
  onRegistrar(): void {
    if (this.formNovo.invalid) { this.formNovo.markAllAsTouched(); return; }

    this.isLoading.set(true);
    this.erroMsg.set('');

    const { nome, apelido, senha } = this.formNovo.value;

    this.conviteService
      .registrarEAceitar(this.codigo, { nome: nome!, apelido: apelido!, senha: senha! })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: authResponse => {
          this.authService.salvarSessao(authResponse);
          this.estado.set('sucesso');
          setTimeout(() => this.router.navigate(['/home']), 1800);
        },
        error: err => {
          this.isLoading.set(false);
          this.erroMsg.set(err?.error?.message || 'Erro ao criar conta. Tente novamente.');
        },
      });
  }

  // ── Caso 2: usuário existente não logado — login → aceitar ────────────────
  onLogin(): void {
    if (this.formLogin.invalid) { this.formLogin.markAllAsTouched(); return; }

    this.isLoading.set(true);
    this.erroMsg.set('');

    const { email, senha } = this.formLogin.value;

    this.authService.login({ email: email!, senha: senha! })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this._aceitar(),
        error: err => {
          this.isLoading.set(false);
          this.erroMsg.set(err?.error?.message || 'Credenciais inválidas.');
        },
      });
  }

  // ── Caso 3: já logado — aceitar diretamente ───────────────────────────────
  onEntrarNoGrupo(): void {
    this.isLoading.set(true);
    this.erroMsg.set('');
    this._aceitar();
  }

  private _aceitar(): void {
    this.conviteService.aceitar(this.codigo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.estado.set('sucesso');
          setTimeout(() => this.router.navigate(['/home']), 1800);
        },
        error: err => {
          this.isLoading.set(false);
          this.erroMsg.set(err?.error?.message || 'Erro ao entrar no grupo.');
        },
      });
  }
}
