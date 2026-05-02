# Processo de Autenticação — Favly App

Documentação do fluxo completo de autenticação: cadastro, ativação de conta, login, recuperação de senha, convites e seleção de grupo.

---

## Índice

1. [Cadastro](#1-cadastro)
2. [Ativação de Conta](#2-ativação-de-conta)
3. [Login](#3-login)
4. [Recuperação de Senha](#4-recuperação-de-senha)
5. [Sistema de Grupos](#5-sistema-de-grupos)
6. [Convites](#6-convites)
7. [Sessão e Armazenamento](#7-sessão-e-armazenamento)
8. [Guards e Rotas](#8-guards-e-rotas)
9. [Interceptor HTTP](#9-interceptor-http)
10. [Fluxos Completos](#10-fluxos-completos)

---

## 1. Cadastro

**Rota:** `/auth/criar-conta`  
**Componente:** `src/app/features/auth/criar-conta/criar-conta.component.ts`

O usuário preenche um formulário com seus dados básicos. Um avatar opcional pode ser enviado como base64.

### Campos do formulário

| Campo  | Validação                  |
|--------|----------------------------|
| Nome   | Obrigatório, mínimo 3 chars |
| Email  | Obrigatório, formato válido |
| Senha  | Obrigatório, mínimo 6 chars |
| Avatar | Opcional, máximo 2 MB      |

### Endpoint

```
POST /api/usuarios
Body: { nome, email, senha, avatar? }
```

### Resultado

- **Sucesso:** redireciona para `/auth/login`
- **Erro:** exibe mensagem de erro na tela

> Após o cadastro, o backend envia um e-mail com o código de ativação. A conta ainda não pode fazer login até ser ativada.

---

## 2. Ativação de Conta

**Componente:** `src/app/features/auth/ativar-conta/ativar-conta-dialog.component.ts`

A ativação é acionada automaticamente quando o login retorna status `403` ou uma mensagem contendo `"ativ"`. Um dialog modal é exibido solicitando o código recebido por e-mail.

### Endpoints

```
POST /api/usuarios/{email}/ativar
Body: { codigo }

POST /api/usuarios/reenviar-ativacao
Body: { email }
```

### Fluxo

1. Usuário tenta fazer login com conta não ativada
2. Backend retorna `403` ou mensagem de conta inativa
3. Dialog de ativação abre automaticamente
4. Usuário insere o código recebido no e-mail (mínimo 4 caracteres)
5. Código validado → dialog fecha → usuário pode fazer login
6. Se necessário, reenvio disponível com cooldown de **60 segundos**

---

## 3. Login

**Rota:** `/auth/login`  
**Componente:** `src/app/features/auth/login/login.component.ts`  
**Serviço:** `src/app/core/services/auth.service.ts`

### Campos do formulário

| Campo | Validação                   |
|-------|-----------------------------|
| Email | Obrigatório, formato válido |
| Senha | Obrigatório, mínimo 6 chars |

### Endpoint

```
POST /api/auth/login
Body: { email, senha }

Response: {
  token: string,
  nome: string,
  email: string,
  expiracao: string,
  grupoId: string,
  grupoNome: string,
  userId?: string
}
```

### Resultado

| Cenário                    | Comportamento                               |
|----------------------------|---------------------------------------------|
| Credenciais válidas        | Salva sessão → redireciona para `/grupos`   |
| Conta não ativada (403)    | Abre dialog de ativação                     |
| Credenciais inválidas      | Exibe mensagem de erro                      |

---

## 4. Recuperação de Senha

### Passo 1 — Solicitar token de redefinição

**Rota:** `/auth/esquecer-senha`  
**Componente:** `src/app/features/auth/esquecer-senha/esquecer-senha.component.ts`

```
POST /api/auth/esqueci-senha
Body: { email }
```

O backend envia um e-mail com o token de redefinição. A tela exibe mensagem de sucesso.

### Passo 2 — Redefinir a senha

**Rota:** `/auth/redefinir-senha`  
**Componente:** `src/app/features/auth/redefinir-senha/redefinir-senha.component.ts`

| Campo            | Validação                       |
|------------------|---------------------------------|
| Token            | Obrigatório (colado do e-mail)  |
| Nova Senha       | Obrigatório, mínimo 6 chars     |
| Confirmação      | Obrigatório, deve coincidir     |

```
POST /api/auth/redefinir-senha
Body: { token, novaSenha, confirmacaoSenha }
```

**Sucesso:** redireciona para `/auth/login`.

---

## 5. Sistema de Grupos

**Rota:** `/grupos`  
**Componente:** `src/app/features/grupos/grupos.component.ts`  
**Serviço:** `src/app/features/grupos/services/grupo.service.ts`

Após o login, se o usuário não tiver um grupo ativo selecionado, é redirecionado para `/grupos` antes de acessar o app.

### Modelo

```typescript
interface Grupo {
  id: string;
  nome: string;
  avatar: string;
  codigoConvite: string;
  totalMembros: number;
}
```

### Endpoints

| Método | Endpoint                        | Descrição              |
|--------|---------------------------------|------------------------|
| GET    | `/api/grupos`                   | Listar grupos do usuário |
| GET    | `/api/grupos/{grupoId}`         | Detalhes do grupo      |
| GET    | `/api/grupos/{grupoId}/membros` | Membros do grupo       |
| POST   | `/api/grupos`                   | Criar novo grupo       |
| PUT    | `/api/grupos/{grupoId}`         | Atualizar grupo        |
| DELETE | `/api/grupos/{grupoId}/sair`    | Sair do grupo          |

### Fluxo na página de grupos

1. Lista os grupos do usuário via `GET /api/grupos`
2. Se tiver apenas 1 grupo → seleciona automaticamente e vai para `/home`
3. Se tiver múltiplos → usuário escolhe qual grupo ativar
4. Opções adicionais:
   - **Entrar por código:** `POST /api/grupos/entrar` com `{ codigo, apelido }`
   - **Criar novo grupo:** `POST /api/grupos` com `{ nome, apelido }`

Ao selecionar um grupo, `grupo_key` e `grupo_nome` são gravados no `localStorage` e o usuário é redirecionado para `/home`.

---

## 6. Convites

**Rota pública:** `/convite/:codigo`  
**Componente:** `src/app/features/convite/convite-aceite.component.ts`  
**Serviço:** `src/app/features/convite/convite.service.ts`

O sistema de convites permite adicionar membros a um grupo via link enviado por e-mail.

### Endpoints

| Método | Endpoint                                          | Auth     | Descrição                        |
|--------|---------------------------------------------------|----------|----------------------------------|
| GET    | `/api/convites/{codigo}`                          | Público  | Buscar dados do convite          |
| POST   | `/api/convites/{codigo}/entrar`                   | Público  | Aceitar convite (novo/existente) |
| POST   | `/api/convites/{codigo}/aceitar`                  | Privado  | Aceitar convite (logado)         |
| GET    | `/api/grupos/{grupoId}/convites`                  | Admin    | Listar convites pendentes        |
| POST   | `/api/grupos/{grupoId}/convites`                  | Admin    | Enviar convite por e-mail        |
| POST   | `/api/grupos/{grupoId}/convites/{id}/reenviar`    | Admin    | Reenviar convite                 |
| DELETE | `/api/grupos/{grupoId}/convites/{id}`             | Admin    | Cancelar convite                 |

### Cenário A — Novo usuário via convite

```
1. Recebe e-mail com link /convite/{codigo}
2. GET /api/convites/{codigo} → retorna info do convite
   (usuarioJaCadastrado: false)
3. Formulário pede: nome, senha, apelido
4. POST /api/convites/{codigo}/entrar
5. Response: { token, usuarioNome, grupoId, grupoNome }
6. Sessão salva automaticamente → redireciona para /home
```

### Cenário B — Usuário existente via convite (não logado)

```
1. Recebe e-mail com link /convite/{codigo}
2. GET /api/convites/{codigo} → retorna info do convite
   (usuarioJaCadastrado: true)
3. Formulário pede: senha, apelido
4. POST /api/convites/{codigo}/entrar
5. Response: { token, usuarioNome, grupoId, grupoNome }
6. Sessão salva automaticamente → redireciona para /home
```

### Cenário C — Usuário já autenticado via convite

```
1. Recebe e-mail com link /convite/{codigo}
2. Usuário já está logado
3. GET /api/convites/{codigo} → retorna info do convite
4. Formulário pede apenas: apelido
5. POST /api/convites/{codigo}/aceitar { apelido }
6. Adicionado ao grupo → redireciona para /grupos
```

---

## 7. Sessão e Armazenamento

**Serviço:** `src/app/core/services/auth.service.ts`

Toda a sessão é mantida via `localStorage` com as seguintes chaves:

| Chave        | Conteúdo                  |
|--------------|---------------------------|
| `auth_token` | JWT do usuário            |
| `user_nome`  | Nome do usuário           |
| `user_email` | E-mail do usuário         |
| `user_id`    | ID do usuário (do JWT)    |
| `grupo_key`  | ID do grupo ativo         |
| `grupo_nome` | Nome do grupo ativo       |

### Métodos do AuthService

| Método              | Descrição                                   |
|---------------------|---------------------------------------------|
| `login(payload)`    | Autentica e salva sessão no localStorage    |
| `logout()`          | Limpa localStorage e redireciona para login |
| `isAuthenticated()` | Verifica se há token salvo                  |
| `getToken()`        | Retorna o JWT                               |
| `getUserId()`       | Retorna o ID do usuário                     |
| `getGrupoId()`      | Retorna o ID do grupo ativo                 |
| `salvarSessao()`    | Persiste sessão após aceite de convite      |

O `userId` é extraído do JWT via claims (`sub`, `userId` ou `nameid`) quando não está disponível diretamente.

---

## 8. Guards e Rotas

### Estrutura de Rotas

```
/                      → redireciona para /auth/login
/auth  (noAuthGuard)
  /auth/login
  /auth/criar-conta
  /auth/esquecer-senha
  /auth/redefinir-senha

/convite/:codigo       → público, sem guard

/grupos  (authGuard)
/home    (authGuard)
```

### Auth Guard

**Arquivo:** `src/app/core/guards/auth.guard.ts`

- Protege rotas autenticadas (`/home`, `/grupos`)
- Se não houver token → redireciona para `/auth/login`
- No SSR, deixa passar (o cliente verifica depois)

### No-Auth Guard

**Arquivo:** `src/app/core/guards/no-auth.guard.ts`

- Protege rotas públicas de autenticação (`/auth/*`)
- Se autenticado **com** grupoId → redireciona para `/home`
- Se autenticado **sem** grupoId → redireciona para `/grupos`
- Se não autenticado → permite acesso normalmente

---

## 9. Interceptor HTTP

**Arquivo:** `src/app/core/interceptors/auth.interceptor.ts`

Adiciona automaticamente o header de autenticação em todas as requisições:

```
Authorization: Bearer {token}
```

Caso a API retorne `401 Unauthorized`, o interceptor chama `logout()` e redireciona para o login, garantindo que sessões expiradas sejam tratadas de forma transparente.

---

## 10. Fluxos Completos

### Novo usuário — cadastro direto

```
/auth/criar-conta
  └─ POST /api/usuarios
       └─ E-mail de ativação enviado
            └─ /auth/login
                 └─ POST /api/auth/login → 403 (conta inativa)
                      └─ Dialog de ativação
                           └─ POST /api/usuarios/{email}/ativar
                                └─ /auth/login (de novo)
                                     └─ POST /api/auth/login → sucesso
                                          └─ /grupos
                                               └─ Selecionar/criar grupo
                                                    └─ /home
```

### Usuário existente — login normal

```
/auth/login
  └─ POST /api/auth/login → sucesso
       └─ /grupos
            └─ Selecionar grupo (ou auto-seleciona se único)
                 └─ /home
```

### Novo usuário via convite

```
E-mail → /convite/{codigo}
  └─ GET /api/convites/{codigo} (usuarioJaCadastrado: false)
       └─ Formulário: nome, senha, apelido
            └─ POST /api/convites/{codigo}/entrar
                 └─ Sessão salva automaticamente
                      └─ /home
```

### Recuperação de senha

```
/auth/esquecer-senha
  └─ POST /api/auth/esqueci-senha
       └─ E-mail com token enviado
            └─ /auth/redefinir-senha
                 └─ POST /api/auth/redefinir-senha
                      └─ /auth/login
```
