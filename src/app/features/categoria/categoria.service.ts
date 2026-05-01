import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from  '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { Categoria, CriarCategoriaPayload, EditarCategoriaPayload } from './categoria.model';

@Injectable({ providedIn: 'root' })
export class CategoriaService {

  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  private get baseUrl(): string {
    const grupoId = this.authService.getGrupoId();
    return `${environment.apiUrl}/grupos/${grupoId}/categorias`;
  }

  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.baseUrl);
  }

  criar(payload: CriarCategoriaPayload): Observable<Categoria> {
    return this.http.post<Categoria>(this.baseUrl, payload);
  }

  editar(id: string, payload: EditarCategoriaPayload): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.baseUrl}/${id}`, payload);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
