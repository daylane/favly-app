export interface Grupo {
    id: string;
    nome: string;
    avatar: string;
    codigoConvite: string;
    totalMembros: number;
}

export interface CriarCGrupoPayload {
    nome: string;
    avatar: string;
    apelido: string;
}

export interface GrupoMembros {
    id: string;
    usuarioId: string;
    nome: string;
    avatar: string;
    apelido: string;
    role: string;
    dataEntrada: string;
}
