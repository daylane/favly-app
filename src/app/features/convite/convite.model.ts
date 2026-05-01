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

// ── POST /api/convites/{codigo}/entrar (público) ──────────────────────────────
// Usado para usuários com ou sem conta (usuarioJaCadastrado define quais campos enviar)
export interface EntrarConvitePayload {
  senha:   string;
  apelido: string;
  nome?:   string;   // obrigatório apenas quando usuarioJaCadastrado === false
  avatar?: string;
}

// Retorno do endpoint /entrar
export interface EntrarConviteResponse {
  token:       string;
  usuarioNome: string;
  grupoId:     string;
  grupoNome:   string;
  expiracao:   string;
}

// ── POST /api/convites/{codigo}/aceitar (requer JWT) ─────────────────────────
export interface AceitarConvitePayload {
  apelido: string;
}
