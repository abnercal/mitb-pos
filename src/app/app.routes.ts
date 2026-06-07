import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./auth/login/login.component'),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout.component'),
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard.component'),
      },
      {
        path: 'config',
        loadComponent: () => import('./config/config.component'),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
