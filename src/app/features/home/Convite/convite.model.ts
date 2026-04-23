// ── Convite listado no painel de membros ──────────────────────────────────────
export interface Convite {
  id: string;
  emailConvidado: string;
  codigo: string;
  status: string; // 'pendente' | 'aceito' | 'expirado' | 'recusado'
  dataExpiracao: string;
  dataCriacao: string;
}

// ── POST /api/grupos/{grupoId}/convites ───────────────────────────────────────
export interface ConvitePayload {
  emailConvidado: string;
}

// ── GET /api/convites/{codigo} (público, sem auth) ────────────────────────────
export interface ConviteInfo {
  grupoNome: string;
  emailConvidado: string;
  dataExpiracao: string;
  usuarioJaCadastrado: boolean;
}

// ── POST /api/convites/{codigo}/registrar-e-aceitar ───────────────────────────
// Retorna AuthResponse (JWT) — conta criada já ativada
export interface RegistrarEAceitarPayload {
  nome: string;
  senha: string;
  apelido: string;
}
