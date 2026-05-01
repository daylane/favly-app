import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { Produto, CriarProdutoPayload, EditarProdutoPayload } from './produto.model';

@Injectable({ providedIn: 'root' })
export class ProdutoService {

  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  private get grupoId(): string {
    return this.authService.getGrupoId() ?? '';
  }

  private get baseUrl(): string {
    return `${environment.apiUrl}/grupos/${this.grupoId}/produtos`;
  }

  listar(): Observable<Produto[]> {
    return this.http.get<Produto[]>(this.baseUrl);
  }

  listarEstoqueBaixo(): Observable<Produto[]> {
    return this.http.get<Produto[]>(`${this.baseUrl}/estoque-baixo`);
  }

  buscarPorId(id: string): Observable<Produto> {
    return this.http.get<Produto>(`${this.baseUrl}/${id}`);
  }

  criar(payload: CriarProdutoPayload): Observable<Produto> {
    return this.http.post<Produto>(this.baseUrl, payload);
  }

  editar(id: string, payload: EditarProdutoPayload): Observable<Produto> {
    return this.http.put<Produto>(`${this.baseUrl}/${id}`, payload);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
