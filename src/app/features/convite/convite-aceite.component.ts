import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MatIconModule }            from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService }    from '../../core/services/auth.service';
import { ConviteService } from '../convite/convite.service';
import { ConviteInfo }    from '../convite/convite.model';

export type ConviteEstado =
  | 'carregando'
  | 'entrar'
  | 'logado'
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
  private destroy$       = new Subject<void>();

  codigo      = '';
  estado      = signal<ConviteEstado>('carregando');
  conviteInfo = signal<ConviteInfo | null>(null);
  erroMsg     = signal('');
  isLoading   = signal(false);
  showSenha   = signal(false);

  formEntrar = this.fb.group({
    nome:    [''],
    senha:   ['', [Validators.required, Validators.minLength(6)]],
    apelido: ['', [Validators.required, Validators.minLength(2)]],
  });

  apelidoLogado = signal('');

  get erroNome():    string { return this.fieldError('nome'); }
  get erroSenha():   string { return this.fieldError('senha'); }
  get erroApelido(): string { return this.fieldError('apelido'); }

  private fieldError(field: string): string {
    const c = this.formEntrar.get(field)!;
    if (!c.invalid || !c.touched) return '';
    if (c.hasError('required'))  return 'Campo obrigatório.';
    if (c.hasError('minlength')) return `Mínimo ${c.errors?.['minlength']?.requiredLength} caracteres.`;
    return '';
  }

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
            this.estado.set('logado');
          } else if (info.usuarioJaCadastrado) {
            // Tem conta mas não está logado — redireciona para o login e volta ao convite
            this.router.navigate(['/auth/login'], {
              queryParams: { returnUrl: `/convite/${this.codigo}` },
            });
          } else {
            // Novo usuário — exibe formulário de cadastro
            this.formEntrar.get('nome')!.setValidators([Validators.required, Validators.minLength(2)]);
            this.formEntrar.get('nome')!.updateValueAndValidity();
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
          this.authService.salvarSessao({
            nome:      res.usuarioNome,
            grupoId:   res.grupoId,
            grupoNome: res.grupoNome,
          });
          this.estado.set('sucesso');
          setTimeout(() => this.router.navigate(['/home']), 1800);
        },
        error: err => {
          this.isLoading.set(false);
          this.erroMsg.set(err?.error?.message || 'Erro ao entrar no grupo. Verifique os dados.');
        },
      });
  }

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
