import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginPayload, SessaoPayload } from '../../shared/models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'auth_token';
  private readonly NOME_KEY = 'user_nome';
  private readonly EMAIL_KEY = 'user_email';
  private readonly GRUPO_NOME_KEY = 'grupo_nome';
  private readonly GRUPO_KEY = 'grupo_key';
  private readonly USER_ID_KEY = 'user_id';
  private readonly AVATAR_KEY = 'user_avatar';

  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(
      tap(response => {
        if (this.isBrowser) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          localStorage.setItem(this.NOME_KEY, response.nome);
          localStorage.setItem(this.EMAIL_KEY, response.email);
          localStorage.setItem(this.GRUPO_KEY, response.grupoId);
          localStorage.setItem(this.GRUPO_NOME_KEY, response.grupoNome);
          if (response.userId) localStorage.setItem(this.USER_ID_KEY, response.userId);
          if (response.avatar) localStorage.setItem(this.AVATAR_KEY, response.avatar);

        }
      })
    );
  }

  esqueceuSenha(email: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/esqueci-senha`, { email });
  }

  redefinirSenha(token: string, novaSenha: string, confirmacaoSenha: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/redefinir-senha`, {
      token,
      novaSenha,
      confirmacaoSenha,
    });
  }

  getUsuario(): { nome: string; email: string } | null {
    if (!this.isBrowser) return null;
    const nome = localStorage.getItem(this.NOME_KEY);
    const email = localStorage.getItem(this.EMAIL_KEY);
    if (!nome || !email) return null;
    return { nome, email };
  }

  getGrupoId(): string | null {
    return this.isBrowser ? localStorage.getItem(this.GRUPO_KEY) : null;
  }

  getUserId(): string | null {
    if (!this.isBrowser) return null;
    const stored = localStorage.getItem(this.USER_ID_KEY);
    if (stored) return stored;
    return this.getUserIdFromToken();
  }

  private getUserIdFromToken(): string | null {
    try {
      const token = this.getToken();
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const id = payload.sub ?? payload.userId ?? payload.nameid ?? null;
      if (id) localStorage.setItem(this.USER_ID_KEY, id);
      return id;
    } catch { return null; }
  }

  getGrupoNome(): string | null {
    return this.isBrowser ? localStorage.getItem(this.GRUPO_NOME_KEY) : null;
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.NOME_KEY);
      localStorage.removeItem(this.EMAIL_KEY);
      localStorage.removeItem(this.GRUPO_KEY);
      localStorage.removeItem(this.GRUPO_NOME_KEY);
      localStorage.removeItem(this.USER_ID_KEY);
      localStorage.removeItem(this.AVATAR_KEY);
    }
    this.router.navigate(['/auth/login']);
  }

  /** Persiste sessão obtida externamente (ex: aceite de convite). */
  salvarSessao(data: SessaoPayload): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.TOKEN_KEY, data.token);
    if (data.nome) localStorage.setItem(this.NOME_KEY, data.nome);
    if (data.email) localStorage.setItem(this.EMAIL_KEY, data.email);
    if (data.grupoId) localStorage.setItem(this.GRUPO_KEY, data.grupoId);
    if (data.grupoNome) localStorage.setItem(this.GRUPO_NOME_KEY, data.grupoNome);
    if (data.userId) localStorage.setItem(this.USER_ID_KEY, data.userId);
    if (data.avatar) localStorage.setItem(this.AVATAR_KEY, data.avatar);
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem(this.TOKEN_KEY) : null;
  }

  getAvatar(): string | null {
    return this.isBrowser ? localStorage.getItem(this.AVATAR_KEY) : null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const { exp } = JSON.parse(atob(token.split('.')[1]));
      return exp * 1000 > Date.now();
    } catch { return false; }
  }
}
