import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(c => c.LoginComponent)
  },
   {
    path: 'criar-conta',
    loadComponent: () => import('./criar-conta/criar-conta.component').then(c => c.CriarContaComponent)
  },
   {
    path: 'esquecer-senha',
    loadComponent: () => import('./esquecer-senha/esquecer-senha.component').then(c => c.EsquecerSenhaComponent)
  },
  {
    path: 'redefinir-senha',
    loadComponent: () => import('./redefinir-senha/redefinir-senha.component').then(c => c.RedefinirSenhaComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];