import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface Grupo {
  id: string;
  nome: string;
  membros?: number;
  codigoConvite?: string;
}

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, MatProgressSpinnerModule],
  templateUrl: './grupos.component.html',
  styleUrls: ['./grupos.component.scss'],
})
export class GruposComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);

  usuario = this.authService.getUsuario();

  grupoAtual = signal<Grupo | null>(this.buildGrupoAtual());
  codigoConvite = signal<string>('');
  mostrarCriarGrupo = signal<boolean>(false);
  nomeNovoGrupo = signal<string>('');
  isLoading = signal<boolean>(false);
  isLoadingEntrar = signal<boolean>(false);

  private buildGrupoAtual(): Grupo | null {
    const id = this.authService.getGrupoId();
    const nome = this.authService.getGrupoNome();
    if (!id || !nome) return null;
    return { id, nome };
  }

  entrarNoGrupo(): void {
    const codigo = this.codigoConvite().trim();
    if (!codigo) return;
    this.isLoadingEntrar.set(true);
    this.http.post<any>(`${environment.apiUrl}/grupos/entrar`, { codigo })
      .subscribe({
        next: (res) => {
          this.isLoadingEntrar.set(false);
          this.snackBar.open('Você entrou no grupo!', 'Fechar', { duration: 3000 });
          this.codigoConvite.set('');
          this.selecionarGrupo({ id: res.id, nome: res.nome });
        },
        error: (err) => {
          this.isLoadingEntrar.set(false);
          this.snackBar.open(err?.error?.message || 'Código inválido.', 'Fechar', { duration: 3000 });
        }
      });
  }

  selecionarGrupo(grupo: Grupo): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('grupo_key', grupo.id);
      localStorage.setItem('grupo_nome', grupo.nome);
    }
    this.router.navigate(['/home']);
  }

  logout(): void {
    this.authService.logout();
  }
}
