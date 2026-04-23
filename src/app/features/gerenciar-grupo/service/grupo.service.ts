import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { AuthService } from "../../../core/services/auth.service";
import { environment } from "../../../../environments/environment";
import { Grupo, GrupoMembros } from "./grupo.model";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class GrupoService {

    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private get baseUrl(): string {
        return `${environment.apiUrl}/grupos/`;
    }

    private get grupoId(): string {
        return this.authService.getGrupoId() ?? '';
    }

    listar(): Observable<Grupo[]> {
        return this.http.get<Grupo[]>(this.baseUrl);
    }

    listarMembros(grupoId: string): Observable<GrupoMembros[]> {
        return this.http.get<GrupoMembros[]>(`${this.baseUrl}/${grupoId}/membros`);
    }

}