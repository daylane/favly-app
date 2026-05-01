import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface GrupoItem {
  id: string;
  nome: string;
  avatar?: string;
  codigoConvite?: string;
  totalMembros?: number;
}

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, MatProgressSpinnerModule],
  templateUrl: './grupos.component.html',
  styleUrls: ['./grupos.component.scss'],
})
export class GruposComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);

  usuario = this.authService.getUsuario();

  // Dados
  grupos = signal<GrupoItem[]>([]);
  isLoadingGrupos = signal(true);

  // Painel ativo: 'lista' | 'entrar' | 'criar'
  painel = signal<'lista' | 'entrar' | 'criar'>('lista');

  // Entrar por código
  codigoConvite = signal('');
  apelido = signal('');
  isLoadingEntrar = signal(false);

  // Criar grupo
  nomeGrupo = signal('');
  apelidoCriador = signal('');
  isLoadingCriar = signal(false);

  ngOnInit(): void {
    this.carregarGrupos();
  }

  carregarGrupos(): void {
    this.isLoadingGrupos.set(true);
    this.http.get<GrupoItem[]>(`${environment.apiUrl}/grupos`).subscribe({
      next: (lista) => {
        this.grupos.set(lista);
        this.isLoadingGrupos.set(false);
        // Se só tem 1 grupo, entra direto
        if (lista.length === 1) {
          this.selecionarGrupo(lista[0]);
        }
      },
      error: () => {
        this.isLoadingGrupos.set(false);
        // Fallback: usa o grupo salvo no localStorage
        const id = this.authService.getGrupoId();
        const nome = this.authService.getGrupoNome();
        if (id && nome) {
          this.grupos.set([{ id, nome }]);
        }
      },
    });
  }

  selecionarGrupo(grupo: GrupoItem): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('grupo_key', grupo.id);
      localStorage.setItem('grupo_nome', grupo.nome);
    }
    this.router.navigate(['/home']);
  }

  // ── Entrar por código ──────────────────────────────────────────────────────
  entrarNoGrupo(): void {
    const codigo = this.codigoConvite().trim().toUpperCase();
    const apelido = this.apelido().trim();
    if (!codigo || !apelido) return;

    this.isLoadingEntrar.set(true);
    this.http.post<GrupoItem>(`${environment.apiUrl}/grupos/entrar`, { codigo, apelido }).subscribe({
      next: (grupo) => {
        this.isLoadingEntrar.set(false);
        this.snackBar.open('Você entrou no grupo!', 'Fechar', { duration: 3000 });
        this.codigoConvite.set('');
        this.apelido.set('');
        this.selecionarGrupo(grupo);
      },
      error: (err) => {
        this.isLoadingEntrar.set(false);
        this.snackBar.open(err?.error?.message || 'Código inválido ou expirado.', 'Fechar', { duration: 4000 });
      },
    });
  }

  // ── Criar grupo ────────────────────────────────────────────────────────────
  criarGrupo(): void {
    const nome = this.nomeGrupo().trim();
    const apelido = this.apelidoCriador().trim();
    if (!nome || !apelido) return;

    this.isLoadingCriar.set(true);
    this.http.post<GrupoItem>(`${environment.apiUrl}/grupos`, { nome, apelido }).subscribe({
      next: (grupo) => {
        this.isLoadingCriar.set(false);
        this.snackBar.open('Grupo criado!', 'Fechar', { duration: 3000 });
        this.nomeGrupo.set('');
        this.apelidoCriador.set('');
        this.selecionarGrupo(grupo);
      },
      error: (err) => {
        this.isLoadingCriar.set(false);
        this.snackBar.open(err?.error?.message || 'Erro ao criar grupo.', 'Fechar', { duration: 4000 });
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
