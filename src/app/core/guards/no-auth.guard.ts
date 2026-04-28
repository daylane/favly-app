import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

/**
 * Bloqueia rotas públicas (login, criar-conta, etc.) para usuários
 * já autenticados — redirecionando direto para a área correta.
 *
 * Com grupoId  → /home
 * Sem grupoId  → /grupos  (precisa selecionar/criar um grupo)
 * Não logado   → deixa acessar a rota pública normalmente
 */
export const noAuthGuard: CanActivateFn = () => {
  const platformId  = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const router      = inject(Router);

  // SSR: deixa passar — o browser verifica depois
  if (!isPlatformBrowser(platformId)) return true;

  if (authService.isAuthenticated()) {
    const destino = authService.getGrupoId() ? '/home' : '/grupos';
    return router.createUrlTree([destino]);
  }

  return true;
};
