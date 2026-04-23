import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { Grupo } from './grupo.model';

@Injectable({ providedIn: 'root' })
export class GrupoService {

  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  buscarDetalhes(): Observable<Grupo> {
    const grupoId = this.authService.getGrupoId();
    return this.http.get<Grupo>(`${environment.apiUrl}/grupos/${grupoId}`);
  }
}
