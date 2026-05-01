import { Component, OnInit, OnDestroy, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MatIconModule }             from '@angular/material/icon';
import { MatProgressSpinnerModule }  from '@angular/material/progress-spinner';

import { AuthService }   from '../../core/services/auth.service';
import { ConviteService } from '../convite/convite.service';
import { ConviteInfo }   from '../convite/convite.model';

export type ConviteEstado =
  | 'carregando'   // buscando dados do convite
  | 'entrar'       // não logado → formulário adaptável (usuário novo ou existente)
  | 'logado'       // já autenticado → só pede apelido
  | 'sucesso'
  | 'erro';

@Component({
  selector: 'app-convite-aceite',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
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
  private platformId     = inject(PLATFORM_ID);
  private destroy$       = new Subject<void>();

  codigo      = '';
  estado      = signal<ConviteEstado>('carregando');
  conviteInfo = signal<ConviteInfo | null>(null);
  erroMsg     = signal('');
  isLoading   = signal(false);
  showSenha   = signal(false);

  // ── Formulário único para o caso "entrar" (não logado) ───────────────────
  // Campos: nome (apenas novos), senha, apelido
  formEntrar = this.fb.group({
    nome:    [''],   // validado dinamicamente
    senha:   ['', [Validators.required, Validators.minLength(6)]],
    apelido: ['', [Validators.required, Validators.minLength(2)]],
  });

  // ── Apelido para o caso "já logado" ──────────────────────────────────────
  apelidoLogado = signal('');

  // Helpers de erro
  get erroNome():   string { return this.fieldError('nome'); }
  get erroSenha():  string { return this.fieldError('senha'); }
  get erroApelido(): string { return this.fieldError('apelido'); }

  private fieldError(field: string): string {
    const c = this.formEntrar.get(field)!;
    if (!c.invalid || !c.touched) return '';
    if (c.hasError('required'))  return 'Campo obrigatório.';
    if (c.hasError('minlength')) return `Mínimo ${c.errors?.['minlength']?.requiredLength} caracteres.`;
    return '';
  }

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.codigo = this.route.snapshot.paramMap.get('codigo') ?? '';

    if (!this.codigo) {
      this.estado.set('erro');
      this.erroMsg.set('Código de convite inválido.');
      return;
    }

    this.conviteService.buscarPorCodigo(this.codigo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: info => {
          this.conviteInfo.set(info);

          if (this.authService.isAuthenticated()) {
            // Usuário logado → só precisa do apelido
            this.estado.set('logado');
          } else {
            // Aplica validação de nome apenas para usuários novos
            if (!info.usuarioJaCadastrado) {
              this.formEntrar.get('nome')!.setValidators([Validators.required, Validators.minLength(2)]);
              this.formEntrar.get('nome')!.updateValueAndValidity();
            }
            this.estado.set('entrar');
          }
        },
        error: err => {
          this.estado.set('erro');
          this.erroMsg.set(err?.error?.message || 'Convite inválido ou expirado.');
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Caso "entrar" (usuário não logado, novo ou existente) ────────────────
  onEntrar(): void {
    if (this.formEntrar.invalid) { this.formEntrar.markAllAsTouched(); return; }

    this.isLoading.set(true);
    this.erroMsg.set('');

    const { nome, senha, apelido } = this.formEntrar.value;
    const info = this.conviteInfo();
    const payload = info?.usuarioJaCadastrado
      ? { senha: senha!, apelido: apelido! }
      : { nome: nome!, senha: senha!, apelido: apelido! };

    this.conviteService.entrar(this.codigo, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          // Salva sessão manualmente com os campos do response
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('auth_token',  res.token);
            localStorage.setItem('user_nome',   res.usuarioNome);
            localStorage.setItem('grupo_key',   res.grupoId);
            localStorage.setItem('grupo_nome',  res.grupoNome);
          }
          this.estado.set('sucesso');
          setTimeout(() => this.router.navigate(['/home']), 1800);
        },
        error: err => {
          this.isLoading.set(false);
          this.erroMsg.set(err?.error?.message || 'Erro ao entrar no grupo. Verifique os dados.');
        },
      });
  }

  // ── Caso "logado" (já tem JWT) ────────────────────────────────────────────
  onAceitar(): void {
    const apelido = this.apelidoLogado().trim();
    if (!apelido) { this.erroMsg.set('Informe um apelido para entrar no grupo.'); return; }

    this.isLoading.set(true);
    this.erroMsg.set('');

    this.conviteService.aceitar(this.codigo, { apelido })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.estado.set('sucesso');
          setTimeout(() => this.router.navigate(['/grupos']), 1800);
        },
        error: err => {
          this.isLoading.set(false);
          this.erroMsg.set(err?.error?.message || 'Erro ao aceitar convite.');
        },
      });
  }
}
