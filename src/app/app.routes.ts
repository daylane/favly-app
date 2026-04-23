import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { RenderMode, ServerRoute } from '@angular/ssr';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.AUTH_ROUTES)
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
  { path: '',   redirectTo: 'auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth/login' }
];

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];