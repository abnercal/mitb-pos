import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ConfigService } from '../core/services/config.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="dashboard">
      <h1 class="page-title">Dashboard</h1>

      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat">
              <mat-icon class="stat-icon sales-icon">point_of_sale</mat-icon>
              <div class="stat-info">
                <span class="stat-value">—</span>
                <span class="stat-label">Ventas hoy</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat">
              <mat-icon class="stat-icon product-icon">inventory_2</mat-icon>
              <div class="stat-info">
                <span class="stat-value">—</span>
                <span class="stat-label">Productos</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat">
              <mat-icon class="stat-icon warning-icon">warning</mat-icon>
              <div class="stat-info">
                <span class="stat-value">—</span>
                <span class="stat-label">Stock bajo</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat">
              <mat-icon class="stat-icon client-icon">people</mat-icon>
              <div class="stat-info">
                <span class="stat-value">—</span>
                <span class="stat-label">Clientes</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="welcome-card">
        <mat-card>
          <mat-card-content>
            <h2>Bienvenido a {{ config.get().appName }}</h2>
            <p>
              Sistema de gestión comercial. Usá el menú lateral para navegar
              entre los módulos.
            </p>
            <p class="config-hint">
              <mat-icon>info</mat-icon>
              Configurá tu empresa, moneda e impuestos en
              <strong>Configuración</strong>.
            </p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard {
        max-width: 1200px;
        margin: 0 auto;
      }

      .page-title {
        font-size: 24px;
        font-weight: 500;
        margin-bottom: 24px;
        color: #333;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .stat-card {
        cursor: default;
      }

      .stat {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .stat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        padding: 12px;
        border-radius: 8px;
      }

      .sales-icon {
        color: #1565c0;
        background: #e3f2fd;
      }

      .product-icon {
        color: #2e7d32;
        background: #e8f5e9;
      }

      .warning-icon {
        color: #e65100;
        background: #fff3e0;
      }

      .client-icon {
        color: #6a1b9a;
        background: #f3e5f5;
      }

      .stat-info {
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #333;
      }

      .stat-label {
        font-size: 14px;
        color: #666;
      }

      .welcome-card {
        margin-top: 16px;
      }

      .welcome-card h2 {
        margin: 0 0 12px;
        color: #333;
      }

      .welcome-card p {
        margin: 0 0 8px;
        color: #555;
        line-height: 1.6;
      }

      .config-hint {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #fff8e1;
        border-radius: 4px;
        font-size: 14px;
      }
    `,
  ],
})
export default class DashboardComponent {
  readonly config = inject(ConfigService);
}
