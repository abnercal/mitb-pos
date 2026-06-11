import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { ModuloService } from '../../core/services/modulo.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  feature?: string;
  /** Si es true, solo visible para SUPERADMIN */
  superadminOnly?: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav
        #sidenav
        [opened]="sidebarOpen()"
        [mode]="'side'"
        class="sidenav"
      >
        <div class="sidenav-header">
          <span class="sidenav-brand">MITB POS</span>
        </div>
        <mat-divider></mat-divider>

        <mat-nav-list>
          <a
            mat-list-item
            *ngFor="let item of filteredNavItems"
            [routerLink]="item.route"
            routerLinkActive="active-link"
            [routerLinkActiveOptions]="{ exact: item.route === '/' }"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="toolbar">
          <button mat-icon-button (click)="sidebarOpen.set(!sidebarOpen())">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="toolbar-spacer"></span>

          <button mat-raised-button color="accent" routerLink="/pos" class="pos-btn">
            <mat-icon>point_of_sale</mat-icon>
            POS
          </button>

          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="user-info-menu" mat-menu-item disabled>
              <strong>{{ session?.user?.nombre }} {{ session?.user?.apellido }}</strong>
              <br />
              <small>{{ session?.user?.email }}</small>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item routerLink="/config">
              <mat-icon>settings</mat-icon>
              <span>Configuración</span>
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Cerrar sesión</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .sidenav-container {
        height: 100vh;
      }

      .sidenav {
        width: 250px;
        background: #fafafa;
      }

      .sidenav-header {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 64px;
      }

      .sidenav-brand {
        font-size: 20px;
        font-weight: 700;
        color: #1565c0;
      }

      .toolbar {
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .toolbar-spacer {
        flex: 1 1 auto;
      }

      .content {
        padding: 24px;
        min-height: calc(100vh - 64px);
        background: #f5f5f5;
      }

      .pos-btn { margin-right: 12px; font-weight: 600; }
      .active-link {
        background: rgba(21, 101, 192, 0.1) !important;
        border-left: 3px solid #1565c0;
      }

      .user-info-menu {
        padding: 8px 16px !important;
        line-height: 1.5;
      }

      mat-nav-list a {
        height: 48px;
      }
    `,
  ],
})
export default class MainLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly modulos = inject(ModuloService);
  readonly sidebarOpen = signal(true);
  readonly session = this.auth.getSession();

  private readonly navItems: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/' },
    { icon: 'point_of_sale', label: 'POS', route: '/pos', feature: 'pos' },
    { icon: 'shopping_cart', label: 'Ventas', route: '/ventas', feature: 'ventas' },
    { icon: 'inventory_2', label: 'Productos', route: '/productos', feature: 'productos' },
    { icon: 'assessment', label: 'Inventario', route: '/reportes/inventario', feature: 'inventario' },
    { icon: 'people_outline', label: 'Clientes', route: '/clientes', feature: 'clientes' },
    { icon: 'category', label: 'Categorías', route: '/categorias', feature: 'categorias' },
    { icon: 'branding', label: 'Marcas', route: '/marcas', feature: 'marcas' },
    { icon: 'straighten', label: 'Unidades', route: '/unidades', feature: 'unidades' },
    { icon: 'inventory', label: 'Presentaciones', route: '/presentaciones', feature: 'presentaciones' },
    { icon: 'local_shipping', label: 'Proveedores', route: '/proveedores', feature: 'proveedores' },
    { icon: 'shopping_cart', label: 'Compras', route: '/compras', feature: 'compras' },
    { icon: 'store', label: 'Sucursales', route: '/sucursales', feature: 'sucursales' },
    { icon: 'people', label: 'Usuarios', route: '/usuarios', feature: 'usuarios' },
    { icon: 'admin_panel_settings', label: 'Roles', route: '/roles', feature: 'roles' },
    { icon: 'vpn_key', label: 'Permisos', route: '/permisos', feature: 'permisos' },
    { icon: 'settings', label: 'Configuración', route: '/config', feature: 'config' },
    { icon: 'tune', label: 'Módulos (Admin)', route: '/modulos', feature: 'modulos', superadminOnly: true },
  ];

  get filteredNavItems(): NavItem[] {
    return this.navItems.filter((item) => {
      // Items solo superadmin
      if (item.superadminOnly) {
        return this.auth.hasRole('SUPERADMIN');
      }

      // Items sin feature (dashboard) siempre visibles
      if (!item.feature) return true;

      // Consultar permiso dinámico desde la tabla modulos
      const permiso = this.modulos.getPermiso(item.feature);
      if (!permiso) return true; // feature sin restricción

      return this.auth.hasPermiso(permiso);
    });
  }

  logout(): void {
    this.modulos.clear();
    this.auth.logout();
  }
}
