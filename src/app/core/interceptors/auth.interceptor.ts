import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Envia cookies httpOnly automaticamente em todas as requests
  const cloned = req.clone({ withCredentials: true });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // Cookie expirado ou inválido → limpa a sessão e manda para o login
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};
