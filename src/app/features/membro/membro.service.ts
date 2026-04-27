import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { Membro } from './membro.model';

@Injectable({ providedIn: 'root' })
export class MembroService {

  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  private get baseUrl(): string {
    const grupoId = this.authService.getGrupoId();
    return `${environment.apiUrl}/grupos/${grupoId}/membros`;
  }

  listar(): Observable<Membro[]> {
    return this.http.get<Membro[]>(this.baseUrl);
  }

  /** DELETE /api/grupos/{grupoId}/membros/{membroId} */
  remover(membroId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${membroId}`);
  }

  /** PATCH /api/grupos/{grupoId}/membros/{membroId}/papel
   *  novoPapel: 0 = Administrador, 1 = Usuario
   */
  alterarPapel(membroId: string, novoPapel: 0 | 1): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${membroId}/papel`, { novoPapel });
  }

  
}

