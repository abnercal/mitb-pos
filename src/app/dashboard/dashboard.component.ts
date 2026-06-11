import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { VentaService } from '../core/services/venta.service';
import { ProductoService } from '../core/services/producto.service';
import { ProveedorService } from '../core/services/proveedor.service';
import { ClienteService } from '../core/services/cliente.service';
import { AppEventsService } from '../core/services/app-events.service';
import { Venta } from '../core/interfaces/venta.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule, MatChipsModule, RouterModule],
  template: `
    <h1 class="page-title">Dashboard</h1>

    <div class="cards-grid">
      <mat-card class="stat-card sales">
        <mat-icon>point_of_sale</mat-icon>
        <div class="stat-info">
          <span class="stat-label">Ventas hoy</span>
          <span class="stat-value">Q {{ todaySales() | number:'.2' }}</span>
        </div>
      </mat-card>

      <mat-card class="stat-card count">
        <mat-icon>inventory_2</mat-icon>
        <div class="stat-info">
          <span class="stat-label">Productos</span>
          <span class="stat-value">{{ totalProductos() }}</span>
        </div>
      </mat-card>

      <mat-card class="stat-card clients">
        <mat-icon>people_outline</mat-icon>
        <div class="stat-info">
          <span class="stat-label">Clientes</span>
          <span class="stat-value">{{ totalClientes() }}</span>
        </div>
      </mat-card>

      <mat-card class="stat-card providers">
        <mat-icon>local_shipping</mat-icon>
        <div class="stat-info">
          <span class="stat-label">Proveedores</span>
          <span class="stat-value">{{ totalProveedores() }}</span>
        </div>
      </mat-card>
    </div>

    <mat-card class="table-card">
      <mat-card-header>
        <mat-card-title>Últimas ventas</mat-card-title>
        <a mat-button routerLink="/ventas" class="header-link">Ver todas</a>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="recentSales()" class="full-table">
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Referencia</th>
            <td mat-cell *matCellDef="let item">{{ item.nombre }}</td>
          </ng-container>
          <ng-container matColumnDef="cliente">
            <th mat-header-cell *matHeaderCellDef>Cliente</th>
            <td mat-cell *matCellDef="let item">{{ item.Cliente?.nombres || 'Mostrador' }}</td>
          </ng-container>
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let item"><strong>Q {{ (item.total || 0) | number:'.2' }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let item">{{ (item.fecha || item.createdAt) | date:'short' }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="['nombre','cliente','total','fecha']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['nombre','cliente','total','fecha']"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td [attr.colspan]="4"><div class="empty-state"><p>No hay ventas recientes</p></div></td>
          </tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-title { font-size: 24px; font-weight: 500; margin: 0 0 20px 0; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .stat-card mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label { font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 24px; font-weight: 700; margin-top: 4px; }
    .sales mat-icon { color: #1565c0; }
    .count mat-icon { color: #2e7d32; }
    .clients mat-icon { color: #6a1b9a; }
    .providers mat-icon { color: #e65100; }
    .table-card { margin-top: 8px; }
    .header-link { margin-left: auto; }
    .full-table { width: 100%; }
    .empty-state { text-align: center; padding: 24px; color: #999; }
  `],
})
export default class DashboardComponent implements OnInit {
  private readonly ventaService = inject(VentaService);
  private readonly productoService = inject(ProductoService);
  private readonly proveedorService = inject(ProveedorService);
  private readonly clienteService = inject(ClienteService);
  private readonly appEvents = inject(AppEventsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly totalProductos = signal(0);
  readonly totalClientes = signal(0);
  readonly totalProveedores = signal(0);
  readonly todaySales = signal(0);
  readonly recentSales = signal<Venta[]>([]);

  ngOnInit(): void {
    this.loadData();

    // Refrescar automático: evento interno + polling cada 30s como respaldo
    this.appEvents.saleCompleted$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadData();
    });

    interval(30_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadData();
    });
  }

  private loadData(): void {
    this.productoService.getAllList().subscribe(r => this.totalProductos.set(r.length));
    this.clienteService.getAllList().subscribe(r => this.totalClientes.set(r.length));
    this.proveedorService.getAllList().subscribe(r => this.totalProveedores.set(r.length));

    this.ventaService.getAllList().subscribe(r => {
      const today = new Date();

      const hoy = r.filter(v => {
        const raw = v.fecha || v.createdAt;
        if (!raw) return false;

        // Extraer YYYY-MM-DD del string que llegue y construir como fecha local
        const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return false;

        const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        return d.getFullYear() === today.getFullYear()
            && d.getMonth() === today.getMonth()
            && d.getDate() === today.getDate();
      });

      // total viene como string del backend → convertir a número antes de sumar
      this.todaySales.set(hoy.reduce((sum, v) => sum + Number(v.total || 0), 0));
      this.recentSales.set(r.slice(0, 10));
    });
  }
}
