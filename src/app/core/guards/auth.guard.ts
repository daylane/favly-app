import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const platformId  = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (!isPlatformBrowser(platformId)) return true;

  if (authService.isAuthenticated()) return true;

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};