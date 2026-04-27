import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { AuthService } from "../../../core/services/auth.service";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { AtualizarGrupoPayload, Grupo, GrupoMembros } from "./grupo.model";

@Injectable({ providedIn: 'root' })
export class GrupoService {

    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private get baseUrl(): string {
        return `${environment.apiUrl}/grupos/`;
    }

    listar(): Observable<Grupo[]> {
        return this.http.get<Grupo[]>(this.baseUrl);
    }

    listarMembros(grupoId: string): Observable<GrupoMembros[]> {
        return this.http.get<GrupoMembros[]>(`${this.baseUrl}/${grupoId}/membros`);
    }

    buscarDetalhes(): Observable<Grupo> {
        const grupoId = this.authService.getGrupoId();
        return this.http.get<Grupo>(`${environment.apiUrl}/grupos/${grupoId}`);
    }

    sair(grupoId: string): Observable<Grupo> {
        return this.http.delete<Grupo>(`${environment.apiUrl}/grupos/${grupoId}/sair`);
    }

    atualizar(grupoId: string, payload: AtualizarGrupoPayload ): Observable<Grupo> {
        return this.http.put<Grupo>(`${environment.apiUrl}/grupos/${grupoId}`, payload);
    }
}