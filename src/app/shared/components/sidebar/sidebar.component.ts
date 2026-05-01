import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { TabType, MaisTelaType } from '../../types/navigation.types';

export interface UsuarioInfo {
  nome:  string;
  email: string;
}

const AVATAR_COLORS = [
  '#4ade80', '#f97316', '#a78bfa', '#38bdf8',
  '#fb7185', '#facc15', '#34d399', '#60a5fa',
];

function avatarColor(nome: string): string {
  const idx = (nome?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {

  // ── Inputs ────────────────────────────────────────────────────────────────
  tab       = input<TabType>('inicio');
  maisTela  = input<MaisTelaType>(null);
  grupoNome = input<string | null>(null);
  usuario   = input<UsuarioInfo | null>(null);
  darkMode  = input<boolean>(false);

  // ── Outputs ───────────────────────────────────────────────────────────────
  tabChange     = output<TabType>();
  subtelaChange = output<MaisTelaType>();
  navegarGrupos = output<void>();
  novoProduto   = output<void>();
  toggleDark    = output<void>();
  doLogout      = output<void>();

  // ── Helpers ───────────────────────────────────────────────────────────────
  getAvatarColor(nome: string): string { return avatarColor(nome); }
}
