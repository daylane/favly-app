import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { AuthService } from "../../../core/services/auth.service";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { AtualizarMercadoPayload, CriarMercadoPayload, Mercado } from "./mercado.model";

@Injectable({ providedIn: 'root' })
export class MercadoService {

  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  private get grupoId(): string {
    return this.authService.getGrupoId() ?? '';
  }

  private get baseUrl(): string {
    return `${environment.apiUrl}/grupos/${this.grupoId}/mercados`;
  }

  listar(): Observable<Mercado[]> {
    return this.http.get<Mercado[]>(this.baseUrl);
  }

  criar(payload: CriarMercadoPayload): Observable<Mercado> {
    return this.http.post<Mercado>(this.baseUrl, payload);
  }

  editar(id: string, payload: AtualizarMercadoPayload): Observable<Mercado> {
    return this.http.put<Mercado>(`${this.baseUrl}/${id}`, payload);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}