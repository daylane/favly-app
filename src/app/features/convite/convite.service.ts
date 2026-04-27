import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import {
  Convite,
  ConviteInfo,
  ConvitePayload,
  EntrarConvitePayload,
  EntrarConviteResponse,
  AceitarConvitePayload,
} from './convite.model';

@Injectable({ providedIn: 'root' })
export class ConviteService {

  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  private get grupoUrl(): string {
    return `${environment.apiUrl}/grupos/${this.authService.getGrupoId()}/convites`;
  }

  // â”€â”€ Painel de membros â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /** GET /api/grupos/{grupoId}/convites */
  listar(): Observable<Convite[]> {
    return this.http.get<Convite[]>(this.grupoUrl);
  }

  /** POST /api/grupos/{grupoId}/convites â€” envia e-mail com link */
  convidar(payload: ConvitePayload): Observable<void> {
    return this.http.post<void>(this.grupoUrl, payload);
  }

  /** POST /api/grupos/{grupoId}/convites/{conviteId}/reenviar */
  reenviar(conviteId: string): Observable<void> {
    return this.http.post<void>(`${this.grupoUrl}/${conviteId}/reenviar`, {});
  }

  /** DELETE /api/grupos/{grupoId}/convites/{conviteId} */
  cancelar(conviteId: string): Observable<void> {
    return this.http.delete<void>(`${this.grupoUrl}/${conviteId}`);
  }

  // â”€â”€ PÃ¡gina pÃºblica /convite/:codigo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * GET /api/convites/{codigo} (pÃºblico)
   * Retorna: emailConvidado, grupoNome, usuarioJaCadastrado
   */
  buscarPorCodigo(codigo: string): Observable<ConviteInfo> {
    return this.http.get<ConviteInfo>(`${environment.apiUrl}/convites/${codigo}`);
  }

  /**
   * POST /api/convites/{codigo}/entrar (pÃºblico â€” sem JWT)
   * Usado tanto para usuÃ¡rios existentes quanto para novos.
   *   - usuarioJaCadastrado=true  â†’ enviar { senha, apelido }
   *   - usuarioJaCadastrado=false â†’ enviar { nome, senha, apelido, avatar? }
   * Retorna token JWT + dados do grupo para auto-login.
   */
  entrar(codigo: string, payload: EntrarConvitePayload): Observable<EntrarConviteResponse> {
    return this.http.post<EntrarConviteResponse>(
      `${environment.apiUrl}/convites/${codigo}/entrar`,
      payload,
    );
  }

  /**
   * POST /api/convites/{codigo}/aceitar (requer JWT)
   * Usado somente quando o usuÃ¡rio jÃ¡ estÃ¡ autenticado.
   */
  aceitar(codigo: string, payload: AceitarConvitePayload): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/convites/${codigo}/aceitar`,
      payload,
    );
  }
}

