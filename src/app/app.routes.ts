import { Routes } from '@angular/router';
import { authGuard }   from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { RenderMode, ServerRoute } from '@angular/ssr';

export const routes: Routes = [
  {
    // Todas as rotas de auth bloqueadas para quem já está logado
    path: 'auth',
    canActivate: [noAuthGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.AUTH_ROUTES)
  },
  {
    // Rota pública — link enviado por e-mail: /convite/{codigo}
    path: 'convite/:codigo',
    loadComponent: () =>
      import('./features/convite/convite-aceite.component').then(c => c.ConviteAceiteComponent),
  },
  {
    path: 'grupos',
    loadComponent: () => import('./features/grupos/grupos.component').then(c => c.GruposComponent),
    canActivate: [authGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/tela-inicial.component').then(c => c.HomeComponent),
    canActivate: [authGuard]
  },
  // Raiz: noAuthGuard redireciona para /home ou /grupos se logado;
  // caso contrário cai no auth/login via wildcard abaixo
  { path: '',   redirectTo: 'auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth/login' }
];

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];