import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards/auth.guard';
import { featurePermisoGuard } from './core/guards/feature-permiso.guard';

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
        canActivate: [featurePermisoGuard('config')],
        loadComponent: () => import('./config/config.component'),
      },
      {
        path: 'categorias',
        canActivate: [featurePermisoGuard('categorias')],
        loadComponent: () => import('./categorias/list/categorias-list.component'),
      },
      {
        path: 'marcas',
        canActivate: [featurePermisoGuard('marcas')],
        loadComponent: () => import('./marcas/list/marcas-list.component'),
      },
      {
        path: 'unidades',
        canActivate: [featurePermisoGuard('unidades')],
        loadComponent: () => import('./unidades/list/unidades-list.component'),
      },
      {
        path: 'presentaciones',
        canActivate: [featurePermisoGuard('presentaciones')],
        loadComponent: () => import('./presentaciones/list/presentaciones-list.component'),
      },
      {
        path: 'proveedores',
        canActivate: [featurePermisoGuard('proveedores')],
        loadComponent: () => import('./proveedores/list/proveedores-list.component'),
      },
      {
        path: 'clientes',
        canActivate: [featurePermisoGuard('clientes')],
        loadComponent: () => import('./clientes/list/clientes-list.component'),
      },
      {
        path: 'productos',
        canActivate: [featurePermisoGuard('productos')],
        loadComponent: () => import('./productos/list/productos-list.component'),
      },
      {
        path: 'compras',
        canActivate: [featurePermisoGuard('compras')],
        loadComponent: () => import('./compras/list/compras-list.component'),
      },
      {
        path: 'ventas',
        canActivate: [featurePermisoGuard('ventas')],
        loadComponent: () => import('./ventas/list/ventas-list.component'),
      },
      {
        path: 'sucursales',
        canActivate: [featurePermisoGuard('sucursales')],
        loadComponent: () => import('./sucursales/list/sucursales-list.component'),
      },
      {
        path: 'pos',
        canActivate: [featurePermisoGuard('pos')],
        loadComponent: () => import('./pos/pos.component'),
      },
      {
        path: 'usuarios',
        canActivate: [featurePermisoGuard('usuarios')],
        loadComponent: () => import('./usuarios/list/usuarios-list.component'),
      },
      {
        path: 'roles',
        canActivate: [featurePermisoGuard('roles')],
        loadComponent: () => import('./roles/list/roles-list.component'),
      },
      {
        path: 'permisos',
        canActivate: [featurePermisoGuard('permisos')],
        loadComponent: () => import('./permisos/list/permisos-list.component'),
      },
      {
        path: 'reportes/inventario',
        canActivate: [featurePermisoGuard('inventario')],
        loadComponent: () => import('./reportes/inventario.component'),
      },
      {
        path: 'modulos',
        canActivate: [featurePermisoGuard('modulos')],
        loadComponent: () => import('./modulos/modulos.component'),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
