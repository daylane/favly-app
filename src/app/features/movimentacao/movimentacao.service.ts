import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { EntradaPayload, SaidaPayload, MovimentacaoItem } from './movimentacao.model';

@Injectable({ providedIn: 'root' })
export class MovimentacaoService {

  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  private get grupoId(): string {
    return this.authService.getGrupoId() ?? '';
  }

  listar(): Observable<MovimentacaoItem[]> {
    return this.http.get<MovimentacaoItem[]>(
      `${environment.apiUrl}/grupos/${this.grupoId}/movimentacoes`
    );
  }

  registrarEntrada(payload: EntradaPayload): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/grupos/${this.grupoId}/movimentacoes/entrada`,
      payload
    );
  }

  registrarSaida(payload: SaidaPayload): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/grupos/${this.grupoId}/movimentacoes/saida`,
      payload
    );
  }
}
