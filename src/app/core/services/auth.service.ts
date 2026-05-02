import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginPayload, SessaoPayload } from '../../shared/models/user.model';
import { environment } from '../../../environments/environment';

interface SessaoCache {
  nome:      string;
  email:     string;
  avatar:    string | null;
  userId:    string | null;
  grupoId:   string;
  grupoNome: string;
  /** PapelMembro: 1 = Administrador, 2 = Usuario */
  papel:     number | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly SESSAO_KEY = 'favly_sessao';

  private http       = inject(HttpClient);
  private router     = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private lerCache(): SessaoCache | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(this.SESSAO_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private salvarCache(data: Partial<SessaoCache>): void {
    if (!this.isBrowser) return;
    const atual = this.lerCache() ?? {} as SessaoCache;
    localStorage.setItem(this.SESSAO_KEY, JSON.stringify({ ...atual, ...data }));
  }

  private limparCache(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.SESSAO_KEY);
    this.limparChavesLegadas();
  }

  private limparChavesLegadas(): void {
    if (!this.isBrowser) return;
    ['auth_token', 'user_nome', 'user_email', 'user_avatar',
     'grupo_key', 'grupo_nome', 'user_id'].forEach(k => localStorage.removeItem(k));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(
      tap(response => {
        this.limparChavesLegadas();
        this.salvarCache({
          nome:      response.nome,
          email:     response.email,
          avatar:    response.avatar ?? null,
          userId:    response.userId ?? null,
          grupoId:   response.grupoId,
          grupoNome: response.grupoNome,
        });
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

  /** Persiste sessão obtida externamente (ex: aceite de convite). */
  salvarSessao(data: SessaoPayload): void {
    this.salvarCache({
      ...(data.nome      && { nome:      data.nome }),
      ...(data.email     && { email:     data.email }),
      ...(data.avatar    && { avatar:    data.avatar }),
      ...(data.userId    && { userId:    data.userId }),
      ...(data.grupoId   && { grupoId:   data.grupoId }),
      ...(data.grupoNome && { grupoNome: data.grupoNome }),
      ...(data.papel != null && { papel: data.papel }),
    });
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
    this.limparCache();
    this.router.navigate(['/auth/login']);
  }

  getUsuario(): { nome: string; email: string } | null {
    const c = this.lerCache();
    if (!c?.nome || !c?.email) return null;
    return { nome: c.nome, email: c.email };
  }

  getAvatar():    string | null { return this.lerCache()?.avatar    ?? null; }
  getGrupoId():   string | null { return this.lerCache()?.grupoId   ?? null; }
  getGrupoNome(): string | null { return this.lerCache()?.grupoNome ?? null; }
  getUserId():    string | null { return this.lerCache()?.userId    ?? null; }

  limparGrupo(): void {
    const atual = this.lerCache();
    if (!atual || !this.isBrowser) return;
    atual.grupoId   = '';
    atual.grupoNome = '';
    atual.papel     = null;
    localStorage.setItem(this.SESSAO_KEY, JSON.stringify(atual));
  }

  /** Retorna true se o usuário é Administrador do grupo atual (papel === 1). */
  isAdminDoGrupo(): boolean {
    return this.lerCache()?.papel === 1;
  }

  /**
   * Verificação local: checa se os dados do usuário estão em cache.
   * A validação real do cookie é feita pelo servidor em cada request —
   * um cookie expirado resulta em 401, que o interceptor trata com logout().
   */
  isAuthenticated(): boolean {
    const c = this.lerCache();
    return !!(c?.nome && c?.email);
  }
}
