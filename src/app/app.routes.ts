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
      {
        path: 'categorias',
        loadComponent: () => import('./categorias/list/categorias-list.component'),
      },
      {
        path: 'marcas',
        loadComponent: () => import('./marcas/list/marcas-list.component'),
      },
      {
        path: 'unidades',
        loadComponent: () => import('./unidades/list/unidades-list.component'),
      },
      {
        path: 'presentaciones',
        loadComponent: () => import('./presentaciones/list/presentaciones-list.component'),
      },
      {
        path: 'proveedores',
        loadComponent: () => import('./proveedores/list/proveedores-list.component'),
      },
      {
        path: 'clientes',
        loadComponent: () => import('./clientes/list/clientes-list.component'),
      },
      {
        path: 'productos',
        loadComponent: () => import('./productos/list/productos-list.component'),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
