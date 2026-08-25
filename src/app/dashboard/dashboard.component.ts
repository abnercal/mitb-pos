import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, merge, Subject, of, forkJoin } from 'rxjs';
import { startWith, catchError } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { VentaService } from '../core/services/venta.service';
import { ProductoService } from '../core/services/producto.service';
import { ProveedorService } from '../core/services/proveedor.service';
import { ClienteService } from '../core/services/cliente.service';
import { AppEventsService } from '../core/services/app-events.service';
import { Venta } from '../core/interfaces/venta.interface';
import { Producto } from '../core/interfaces/producto.interface';
import { Cliente } from '../core/interfaces/cliente.interface';
import { Proveedor } from '../core/interfaces/proveedor.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule, MatChipsModule, MatButtonModule, RouterModule],
  template: `
    <h1 class="page-title">Dashboard</h1>

    @if (loading()) {
      <div class="sk-cards-grid">
        @for (_ of [1,2,3,4]; track _) {
          <div class="sk-card">
            <div class="sk-icon pulse"></div>
            <div class="sk-block">
              <div class="sk-line sk-line--sm pulse"></div>
              <div class="sk-line sk-line--lg pulse"></div>
            </div>
          </div>
        }
      </div>
      <div class="sk-table pulse"></div>
    } @else if (error()) {
      <div class="error-state">
        <mat-icon class="error-icon">error_outline</mat-icon>
        <h2>Algo salió mal</h2>
        <p>{{ error() }}</p>
        <button mat-raised-button color="primary" (click)="loadData()">
          <mat-icon>refresh</mat-icon> Reintentar
        </button>
      </div>
    } @else {
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
              <td mat-cell *matCellDef="let item">{{ item.referencia || item.nombre }}</td>
            </ng-container>
            <ng-container matColumnDef="cliente">
              <th mat-header-cell *matHeaderCellDef>Cliente</th>
              <td mat-cell *matCellDef="let item">{{ item.nombre || item.Cliente?.nombres || 'Consumidor Final' }}</td>
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
    }
  `,
  styles: [`
    .page-title { font-size: 24px; font-weight: 500; margin: 0 0 20px 0; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .stat-card mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label { font-size: 13px; color: var(--mat-sys-on-surface-variant); text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 24px; font-weight: 700; margin-top: 4px; }
    .sales mat-icon { color: var(--mat-sys-primary); }
    .count mat-icon { color: var(--mat-sys-tertiary); }
    .clients mat-icon { color: var(--mat-sys-secondary); }
    .providers mat-icon { color: var(--mat-sys-primary); }
    .table-card { margin-top: 8px; }
    .header-link { margin-left: auto; }
    .full-table { width: 100%; }
    .empty-state { text-align: center; padding: 24px; color: var(--mat-sys-on-surface-variant); }

    .sk-cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .sk-card { display: flex; align-items: center; gap: 16px; padding: 20px; border-radius: 4px; background: var(--mat-sys-surface); }
    .sk-icon { width: 40px; height: 40px; border-radius: 50%; background: var(--mat-sys-surface-container-highest); flex-shrink: 0; }
    .sk-block { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .sk-line { height: 12px; border-radius: 6px; background: var(--mat-sys-surface-container-highest); }
    .sk-line--sm { width: 40%; }
    .sk-line--lg { width: 70%; height: 18px; }
    .sk-table { height: 260px; border-radius: 4px; background: var(--mat-sys-surface-container-highest); }
    .pulse { animation: pulse 1.8s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }

    .error-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 24px; text-align: center; }
    .error-icon { font-size: 64px; width: 64px; height: 64px; color: var(--mat-sys-error); margin-bottom: 16px; }
    .error-state h2 { margin: 0 0 8px 0; font-size: 20px; }
    .error-state p { color: var(--mat-sys-on-surface-variant); margin: 0 0 24px 0; font-size: 14px; }
  `],
})
export default class DashboardComponent implements OnInit {
  private readonly ventaService = inject(VentaService);
  private readonly productoService = inject(ProductoService);
  private readonly proveedorService = inject(ProveedorService);
  private readonly clienteService = inject(ClienteService);
  private readonly appEvents = inject(AppEventsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly totalProductos = signal(0);
  readonly totalClientes = signal(0);
  readonly totalProveedores = signal(0);
  readonly todaySales = signal(0);
  readonly recentSales = signal<Venta[]>([]);

  private readonly refresh$ = new Subject<void>();

  ngOnInit(): void {
    const POLL_INTERVAL_MS = 30_000;

    merge(
      this.refresh$,
      this.appEvents.saleCompleted$,
      interval(POLL_INTERVAL_MS),
    ).pipe(
      startWith(undefined),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadData());
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      productos: this.productoService.getAllList().pipe(
        catchError(err => { console.error('[Dashboard] Error al cargar productos', err); return of([] as Producto[]); }),
      ),
      clientes: this.clienteService.getAllList().pipe(
        catchError(err => { console.error('[Dashboard] Error al cargar clientes', err); return of([] as Cliente[]); }),
      ),
      proveedores: this.proveedorService.getAllList().pipe(
        catchError(err => { console.error('[Dashboard] Error al cargar proveedores', err); return of([] as Proveedor[]); }),
      ),
      ventas: this.ventaService.getAllList().pipe(
        catchError(err => { console.error('[Dashboard] Error al cargar ventas', err); return of([] as Venta[]); }),
      ),
    }).subscribe({
      next: ({ productos, clientes, proveedores, ventas }) => {
        this.totalProductos.set(productos.length);
        this.totalClientes.set(clientes.length);
        this.totalProveedores.set(proveedores.length);

        const today = new Date();
        const hoy = ventas.filter(v => {
          const raw = v.fecha || v.createdAt;
          if (!raw) return false;

          const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (!m) return false;

          const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
          return d.getFullYear() === today.getFullYear()
              && d.getMonth() === today.getMonth()
              && d.getDate() === today.getDate();
        });

        this.todaySales.set(hoy.reduce((sum, v) => sum + Number(v.total || 0), 0));
        this.recentSales.set(ventas.slice(0, 10));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los datos del dashboard');
        this.loading.set(false);
      },
    });
  }
}
