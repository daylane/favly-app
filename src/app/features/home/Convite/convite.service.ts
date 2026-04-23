import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../shared/models/user.model';
import {
  Convite,
  ConviteInfo,
  ConvitePayload,
  RegistrarEAceitarPayload,
} from './convite.model';

@Injectable({ providedIn: 'root' })
export class ConviteService {

  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  private get grupoUrl(): string {
    return `${environment.apiUrl}/grupos/${this.authService.getGrupoId()}/convites`;
  }

  // ── Painel de membros ────────────────────────────────────────────────────────

  /** GET /api/grupos/{grupoId}/convites — lista convites do grupo */
  listar(): Observable<Convite[]> {
    return this.http.get<Convite[]>(this.grupoUrl);
  }

  /** POST /api/grupos/{grupoId}/convites — envia e-mail com link de convite */
  convidar(payload: ConvitePayload): Observable<void> {
    return this.http.post<void>(this.grupoUrl, payload);
  }

  // ── Fluxo de aceite (página pública /convite/:codigo) ────────────────────────

  /**
   * GET /api/convites/{codigo}
   * Sem auth — retorna grupoNome, emailConvidado, dataExpiracao, usuarioJaCadastrado
   */
  buscarPorCodigo(codigo: string): Observable<ConviteInfo> {
    return this.http.get<ConviteInfo>(`${environment.apiUrl}/convites/${codigo}`);
  }

  /**
   * POST /api/convites/{codigo}/registrar-e-aceitar
   * Usuário novo: cria conta já ativada + entra no grupo.
   * Retorna AuthResponse (JWT) para auto-login.
   */
  registrarEAceitar(
    codigo: string,
    payload: RegistrarEAceitarPayload,
  ): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/convites/${codigo}/registrar-e-aceitar`,
      payload,
    );
  }

  /**
   * POST /api/convites/{codigo}/aceitar
   * Usuário existente (já logado ou recém-logado) — entra no grupo.
   */
  aceitar(codigo: string): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/convites/${codigo}/aceitar`,
      {},
    );
  }
}
