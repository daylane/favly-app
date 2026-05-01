import {
  Component, OnInit, OnDestroy,
  inject, signal, computed, output,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';

import { MatIconModule }            from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService }             from '../../../core/services/auth.service';
import { GrupoService }            from '../../grupos/services/grupo.service';
import { MembroService }           from '../../membro/membro.service';
import { Membro }                  from '../../membro/membro.model';
import { ConvidarDialogComponent } from '../../membro/convidar/convidar-dialog.component';
import { ConviteService }          from '../../convite/convite.service';
import { Convite }                 from '../../convite/convite.model';

const AVATAR_COLORS = [
  '#4ade80', '#f97316', '#a78bfa', '#38bdf8',
  '#fb7185', '#facc15', '#34d399', '#60a5fa',
];

function avatarColor(nome: string): string {
  const idx = (nome?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

@Component({
  selector: 'app-grupo-gerenciar',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './grupo-gerenciar.component.html',
  styleUrls: ['./grupo-gerenciar.component.scss'],
})
export class GrupoGerenciarComponent implements OnInit, OnDestroy {

  private authService   = inject(AuthService);
  private grupoService  = inject(GrupoService);
  private membroService = inject(MembroService);
  private conviteService = inject(ConviteService);
  private dialog        = inject(MatDialog);
  private snackBar      = inject(MatSnackBar);
  private clipboard     = inject(Clipboard);
  private router        = inject(Router);
  private destroy$      = new Subject<void>();

  // ── Outputs ───────────────────────────────────────────────────────────────
  /** Emitido após salvar o grupo com o novo nome */
  grupoAtualizado = output<string>();

  // ── Dados do auth ─────────────────────────────────────────────────────────
  grupoNome = this.authService.getGrupoNome();
  grupoId   = this.authService.getGrupoId();
  usuario   = this.authService.getUsuario();

  // ── Loading ───────────────────────────────────────────────────────────────
  isLoadingMembros  = signal(false);
  isLoadingGrupo    = signal(false);
  isLoadingConvites = signal(false);

  // ── Dados ─────────────────────────────────────────────────────────────────
  membros      = signal<Membro[]>([]);
  grupoCodigo  = signal<string>('');
  grupoAvatar  = signal<string>('');
  convites     = signal<Convite[]>([]);

  // ── Modais ────────────────────────────────────────────────────────────────
  showEditGrupoModal = signal(false);
  showLeaveConfirm   = signal(false);
  membroParaRemover  = signal<Membro | null>(null);
  membroParaPromover = signal<Membro | null>(null);
  conviteReenviando  = signal<string | null>(null);
  editNomeGrupo      = signal('');
  editAvatarGrupo    = signal('');
  isSavingGrupo      = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────────
  isAdmin = computed(() =>
    this.membros().some(m => this.isCurrentUser(m) && m.isAdmin === true)
  );

  convitesPendentes = computed(() =>
    this.convites().filter(c => c.status?.toLowerCase() === 'pendente')
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.carregarMembros();
    this.carregarGrupoCodigo();
    this.carregarConvites();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Membros ───────────────────────────────────────────────────────────────
  carregarMembros(): void {
    this.isLoadingMembros.set(true);
    this.membroService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: lista => {
        const normalizada = lista.map(m => ({
          ...m,
          isAdmin: m.isAdmin === true ||
            ['admin', 'administrador'].includes(m.role?.toLowerCase() ?? ''),
        }));
        this.membros.set(normalizada);
        this.isLoadingMembros.set(false);
      },
      error: () => this.isLoadingMembros.set(false),
    });
  }

  carregarGrupoCodigo(): void {
    if (this.grupoCodigo()) return;
    this.isLoadingGrupo.set(true);
    this.grupoService.buscarDetalhes().pipe(takeUntil(this.destroy$)).subscribe({
      next: grupo => {
        this.grupoCodigo.set(grupo.codigoConvite ?? '');
        this.grupoAvatar.set(grupo.avatar ?? '');
        this.isLoadingGrupo.set(false);
      },
      error: () => this.isLoadingGrupo.set(false),
    });
  }

  carregarConvites(): void {
    this.isLoadingConvites.set(true);
    this.conviteService.listar().pipe(takeUntil(this.destroy$)).subscribe({
      next: lista => { this.convites.set(lista); this.isLoadingConvites.set(false); },
      error: ()   => this.isLoadingConvites.set(false),
    });
  }

  // ── Ações de convite ──────────────────────────────────────────────────────
  abrirConvidarDialog(): void {
    const ref = this.dialog.open(ConvidarDialogComponent, {
      width: '420px',
      panelClass: 'convidar-panel',
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(ok => {
      if (ok) {
        this.snackBar.open('Convite enviado!', 'Fechar', { duration: 3000 });
        this.carregarConvites();
      }
    });
  }

  reenviarConvite(convite: Convite): void {
    this.conviteReenviando.set(convite.id);
    this.conviteService.reenviar(convite.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.conviteReenviando.set(null);
        this.snackBar.open(`Convite reenviado para ${convite.emailConvidado}.`, '', { duration: 2500 });
      },
      error: err => {
        this.conviteReenviando.set(null);
        this.snackBar.open(err?.error?.message || 'Erro ao reenviar convite.', 'Fechar', { duration: 3000 });
      },
    });
  }

  cancelarConvite(convite: Convite): void {
    this.conviteService.cancelar(convite.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.convites.update(l => l.filter(c => c.id !== convite.id));
        this.snackBar.open('Convite cancelado.', '', { duration: 2000 });
      },
      error: err => this.snackBar.open(err?.error?.message || 'Erro ao cancelar.', 'Fechar', { duration: 3000 }),
    });
  }

  // ── Ações de membro ───────────────────────────────────────────────────────
  removerMembro(membro: Membro): void {
    this.membroParaRemover.set(membro);
  }

  confirmarRemocao(): void {
    const membro = this.membroParaRemover();
    if (!membro) return;
    this.membroParaRemover.set(null);
    this.membroService.remover(membro.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: ()   => {
        this.membros.update(l => l.filter(m => m.id !== membro.id));
        this.snackBar.open('Membro removido.', '', { duration: 2000 });
      },
      error: err => this.snackBar.open(err?.error?.message || 'Erro ao remover.', 'Fechar', { duration: 3000 }),
    });
  }

  promoverAdmin(membro: Membro): void {
    this.membroParaPromover.set(membro);
  }

  confirmarPromocao(): void {
    const membro = this.membroParaPromover();
    if (!membro) return;
    this.membroParaPromover.set(null);
    this.membroService.alterarPapel(membro.id, 0).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.membros.update(lista =>
          lista.map(m => m.id === membro.id
            ? { ...m, isAdmin: true, role: 'Administrador' }
            : m)
        );
        this.snackBar.open(
          `${membro.apelido || membro.nome} agora é administrador.`, '', { duration: 2500 }
        );
      },
      error: err => this.snackBar.open(err?.error?.message || 'Erro ao promover.', 'Fechar', { duration: 3000 }),
    });
  }

  // ── Ações de grupo ────────────────────────────────────────────────────────
  copiarCodigo(): void {
    const code = this.grupoCodigo();
    if (!code) return;
    this.clipboard.copy(code);
    this.snackBar.open('Código copiado!', '', { duration: 2000 });
  }

  abrirEdicaoGrupo(): void {
    this.editNomeGrupo.set(this.grupoNome ?? '');
    this.editAvatarGrupo.set(this.grupoAvatar());
    this.showEditGrupoModal.set(true);
  }

  cancelarEdicaoGrupo(): void {
    this.showEditGrupoModal.set(false);
  }

  salvarGrupo(): void {
    const nome = this.editNomeGrupo().trim();
    if (!nome || !this.grupoId) return;
    this.isSavingGrupo.set(true);
    this.grupoService.atualizar(this.grupoId, { nome, avatar: this.editAvatarGrupo() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: grupo => {
          this.grupoNome = grupo.nome;
          this.grupoAvatar.set(grupo.avatar ?? '');
          localStorage.setItem('grupo_nome', grupo.nome);
          this.showEditGrupoModal.set(false);
          this.isSavingGrupo.set(false);
          this.grupoAtualizado.emit(grupo.nome);
          this.snackBar.open('Grupo atualizado!', '', { duration: 2000 });
        },
        error: err => {
          this.isSavingGrupo.set(false);
          this.snackBar.open(err?.error?.message || 'Erro ao salvar.', 'Fechar', { duration: 3000 });
        },
      });
  }

  sairDoGrupo(): void {
    if (!this.grupoId) return;
    this.grupoService.sair(this.grupoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showLeaveConfirm.set(false);
          localStorage.removeItem('grupo_key');
          localStorage.removeItem('grupo_nome');
          this.snackBar.open('Você saiu do grupo.', '', { duration: 2000 });
          this.router.navigate(['/grupos']);
        },
        error: err => {
          this.showLeaveConfirm.set(false);
          this.snackBar.open(err?.error?.message || 'Erro ao sair do grupo.', 'Fechar', { duration: 3000 });
        },
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getAvatarColor(nome: string): string { return avatarColor(nome); }

  isCurrentUser(membro: Membro): boolean {
    const userId = this.authService.getUserId();
    if (userId && membro.usuarioId) return membro.usuarioId === userId;
    return membro.isCurrentUser === true || membro.email === this.usuario?.email;
  }

  isMembroAdmin(membro: Membro): boolean {
    return membro.isAdmin === true;
  }

  getGrupoSymbol(): string {
    const av = this.grupoAvatar();
    if (av && !av.includes('.') && !av.toLowerCase().includes('default')) return av;
    return (this.grupoNome || 'G')[0].toUpperCase();
  }

  isAvatarValido(): boolean {
    const av = this.grupoAvatar();
    return !!av && !av.includes('.') && !av.toLowerCase().includes('default');
  }
}
