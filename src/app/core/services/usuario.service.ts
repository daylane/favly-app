import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CriarUsuarioPayload {
  nome: string;
  email: string;
  senha: string;
  avatar?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {

  private http = inject(HttpClient);

  criar(payload: CriarUsuarioPayload): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/usuarios`, payload);
  }

  ativar(email: string, codigo: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/usuarios/${email}/ativar`, { codigo });
  }

  reenviarAtivacao(email: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/usuarios/reenviar-ativacao`, { email });
  }
}
