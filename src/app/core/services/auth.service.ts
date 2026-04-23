import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginPayload } from '../../shared/models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY      = 'auth_token';
  private readonly NOME_KEY       = 'user_nome';
  private readonly EMAIL_KEY      = 'user_email';
  private readonly GRUPO_NOME_KEY = 'grupo_nome';
  private readonly GRUPO_KEY      = 'grupo_key';
  private readonly USER_ID_KEY    = 'user_id';

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
        }
      })
    );
  }

  getUsuario(): { nome: string; email: string } | null {
    if (!this.isBrowser) return null;
    const nome = localStorage.getItem('user_nome');
    const email = localStorage.getItem('user_email');
    if (!nome || !email) return null;
    return { nome, email };
  }

  getGrupoId(): string | null {
    return this.isBrowser ? localStorage.getItem(this.GRUPO_KEY) : null;
  }

  getUserId(): string | null {
    return this.isBrowser ? localStorage.getItem(this.USER_ID_KEY) : null;
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
    }
    this.router.navigate(['/auth/login']);
  }

  /** Persiste uma sessão já obtida (ex: retorno de registrar-e-aceitar) */
  salvarSessao(response: AuthResponse): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.TOKEN_KEY,      response.token);
    localStorage.setItem(this.NOME_KEY,       response.nome);
    localStorage.setItem(this.EMAIL_KEY,      response.email);
    localStorage.setItem(this.GRUPO_KEY,      response.grupoId);
    localStorage.setItem(this.GRUPO_NOME_KEY, response.grupoNome);
    if (response.userId) localStorage.setItem(this.USER_ID_KEY, response.userId);
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem(this.TOKEN_KEY) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}