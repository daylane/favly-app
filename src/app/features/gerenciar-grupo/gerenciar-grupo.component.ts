import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { GrupoService } from './service/grupo.service';
import { GrupoMembros } from './service/grupo.model';

// Interface alinhada ao DTO de leitura do Backend (DDD)
interface Membro {
    id: string;
    nome: string;
    papel: 'admin' | 'membro';
    cor: string;
    apelido?: string;
}

@Component({
    selector: 'app-gerenciar-grupo',
    standalone: true,
    imports: [CommonModule, MatSnackBarModule],
    templateUrl: './gerenciar-grupo.component.html',
    styleUrls: ['./gerenciar-grupo.component.scss']
})
export class GerenciarGrupoComponent implements OnInit, OnDestroy {
    private router = inject(Router);
    private authService = inject(AuthService);
    private snackBar = inject(MatSnackBar);
    private clipboard = inject(Clipboard);
    private grupoService = inject(GrupoService);

    private destroy$ = new Subject<void>();

    nomeGrupo = signal<string>('carregando...');
    codigoGrupo = signal<string>('FAVLY-**-***');
    isLoadingMembros = signal<boolean>(false);
    membros = signal<GrupoMembros[]>([]);

    ngOnInit(): void {
        const id = this.authService.getGrupoId();
        const nome = this.authService.getGrupoNome();

        if (nome) this.nomeGrupo.set(nome);

        if (id) {
            this.carregarMembros(id);
        } else {
            this.snackBar.open('Grupo não encontrado.', 'Fechar', { duration: 3000 });
            this.voltar();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ── Membros ────────────────────────────────────────────────────────────


    carregarMembros(id: string): void {
        this.isLoadingMembros.set(true);

        this.grupoService.listarMembros(id)
            .subscribe({
                next: (res: GrupoMembros[]) => { // Agora o TS aceitará se o service retornar Array
                    const listaMapeada: GrupoMembros[] = res.map(m => ({
                        id: m.id,
                        nome: m.apelido || m.nome, // Use o campo correto vindo do C#
                        apelido: m.apelido,
                        papel: m.role.toString().toLowerCase() === 'admin' ? 'admin' : 'membro',
                        cor: this.getCorPorNome(m.apelido || m.nome)
                    }));

                    this.membros.set(listaMapeada);
                    this.isLoadingMembros.set(false);
                },
                error: (err) => {
                    console.error(err);
                    this.isLoadingMembros.set(false);
                    this.snackBar.open('Erro ao carregar membros.', 'Fechar', { duration: 3000 });
                }
            });
    }

    // Helper para manter as cores fixas por usuário (KISS)
    private getCorPorNome(nome: string): string {
        const cores = ['var(--accent-verde)', 'var(--accent-coral)', 'var(--accent-azul)', 'var(--accent-amarelo)'];
        let hash = 0;
        for (let i = 0; i < nome.length; i++) {
            hash = nome.charCodeAt(i) + ((hash << 5) - hash);
        }
        return cores[Math.abs(hash) % cores.length];
    }

    // ── Ações ──────────────────────────────────────────────────────────────

    voltar(): void {
        this.router.navigate(['/home']);
    }

    copiarCodigo(): void {
        this.clipboard.copy(this.codigoGrupo());
        this.snackBar.open('Código copiado!', 'Fechar', { duration: 2000 });
    }

    abrirConvite(): void {
        // Aqui você deve injetar o MatDialog e abrir o componente de convite
        console.log('Abrir dialog de convite');
    }
}