import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../core/services/auth.service';

export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  prioridade: 'baixa' | 'media' | 'alta';
  categoria: string;
  dataPrazo: Date;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatRippleModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './tela-inicial.component.html',
  styleUrls: ['./tela-inicial.component.scss']
})
export class HomeComponent implements OnInit {

  private router     = inject(Router);
  private authService = inject(AuthService);
  private snackBar   = inject(MatSnackBar);

  usuario = this.authService.getUsuario();

  filtroAtivo = signal<'todas' | 'pendente' | 'em_andamento' | 'concluida'>('todas');

  // Dados de exemplo 
  tarefas = signal<Tarefa[]>([
    { id: 1, titulo: 'Revisar proposta do cliente', descricao: 'Revisar e ajustar proposta comercial', status: 'em_andamento', prioridade: 'alta', categoria: 'Trabalho', dataPrazo: new Date('2026-03-25') },
    { id: 2, titulo: 'Reunião de planejamento', descricao: 'Alinhar metas do trimestre com o time', status: 'pendente', prioridade: 'alta', categoria: 'Reuniões', dataPrazo: new Date('2026-03-22') },
    { id: 3, titulo: 'Atualizar documentação', descricao: 'Atualizar docs do projeto no Confluence', status: 'pendente', prioridade: 'media', categoria: 'Trabalho', dataPrazo: new Date('2026-03-28') },
    { id: 4, titulo: 'Estudar Angular Signals', descricao: 'Ver os novos recursos de reatividade', status: 'concluida', prioridade: 'media', categoria: 'Estudos', dataPrazo: new Date('2026-03-20') },
    { id: 5, titulo: 'Configurar CI/CD', descricao: 'Configurar pipeline no GitHub Actions', status: 'pendente', prioridade: 'baixa', categoria: 'DevOps', dataPrazo: new Date('2026-03-30') },
  ]);

  tarefasFiltradas = computed(() => {
    const filtro = this.filtroAtivo();
    if (filtro === 'todas') return this.tarefas();
    return this.tarefas().filter(t => t.status === filtro);
  });

  totalTarefas     = computed(() => this.tarefas().length);
  totalPendentes   = computed(() => this.tarefas().filter(t => t.status === 'pendente').length);
  totalAndamento   = computed(() => this.tarefas().filter(t => t.status === 'em_andamento').length);
  totalConcluidas  = computed(() => this.tarefas().filter(t => t.status === 'concluida').length);
  progressoGeral   = computed(() => Math.round((this.totalConcluidas() / this.totalTarefas()) * 100));

  ngOnInit(): void {}

  setFiltro(filtro: 'todas' | 'pendente' | 'em_andamento' | 'concluida'): void {
    this.filtroAtivo.set(filtro);
  }

  concluirTarefa(tarefa: Tarefa): void {
    this.tarefas.update(lista =>
      lista.map(t => t.id === tarefa.id ? { ...t, status: 'concluida' as const } : t)
    );
    this.snackBar.open(`"${tarefa.titulo}" concluída!`, 'Desfazer', { duration: 3000 });
  }

  novaTarefa(): void {
    this.snackBar.open('Em breve: criar nova tarefa!', 'Ok', { duration: 2000 });
  }

  getPrioridadeColor(p: string): string {
    return p === 'alta' ? 'warn' : p === 'media' ? 'accent' : 'primary';
  }

  getStatusIcon(s: string): string {
    return s === 'concluida' ? 'check_circle' : s === 'em_andamento' ? 'timelapse' : 'radio_button_unchecked';
  }

  isPrazoProximo(data: Date): boolean {
    const diff = new Date(data).getTime() - Date.now();
    return diff > 0 && diff < 48 * 60 * 60 * 1000;
  }

  isPrazoVencido(data: Date): boolean {
    return new Date(data).getTime() < Date.now();
  }

  logout(): void {
    this.authService.logout();
  }
}