import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ReporteService } from '../core/services/reporte.service';
import { InventarioItem } from '../core/interfaces/reporte-inventario.interface';

type FiltroEstado = 'todos' | 'bajo' | 'sin_stock' | 'normal';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatTableModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatProgressBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>Reporte de Inventario</h1>
      <div class="filters">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar producto, marca o código</mat-label>
          <input matInput [(ngModel)]="searchTerm" (input)="applyFilters()" placeholder="Ej: huevos, coca…">
        </mat-form-field>
        <mat-form-field appearance="outline" class="estado-field">
          <mat-label>Estado</mat-label>
          <mat-select [(value)]="filtroEstado" (selectionChange)="applyFilters()">
            <mat-option value="todos">Todos</mat-option>
            <mat-option value="bajo">Stock bajo</mat-option>
            <mat-option value="sin_stock">Sin stock</mat-option>
            <mat-option value="normal">Normal</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-stroked-button (click)="refresh()">
          <mat-icon>refresh</mat-icon> Actualizar
        </button>
      </div>
      <div class="summary" *ngIf="items().length">
        <span class="summary-item">Total: <strong>{{ items().length }}</strong> productos</span>
        <span class="summary-item warn">Stock bajo: <strong>{{ itemsBajo() }}</strong></span>
        <span class="summary-item danger">Sin stock: <strong>{{ itemsSinStock() }}</strong></span>
      </div>
    </div>

    <mat-progress-bar mode="indeterminate" *ngIf="loading()"></mat-progress-bar>

    <div class="table-container" *ngIf="!loading()">
      <div *ngIf="!filteredItems().length" class="empty-state">
        <mat-icon>inventory_2</mat-icon>
        <p>No se encontraron productos con esos filtros</p>
      </div>

      <table mat-table [dataSource]="filteredItems()" class="inv-table" *ngIf="filteredItems().length">
        <!-- Producto -->
        <ng-container matColumnDef="producto">
          <th mat-header-cell *matHeaderCellDef>Producto</th>
          <td mat-cell *matCellDef="let item">
            <div class="cell-producto">
              <span class="prod-name">{{ item.producto }}</span>
              <span class="prod-marca">{{ item.marca }}</span>
            </div>
          </td>
        </ng-container>

        <!-- Categoría -->
        <ng-container matColumnDef="categoria">
          <th mat-header-cell *matHeaderCellDef>Categoría</th>
          <td mat-cell *matCellDef="let item">{{ item.categoria || '—' }}</td>
        </ng-container>

        <!-- Stock Actual -->
        <ng-container matColumnDef="stock">
          <th mat-header-cell *matHeaderCellDef>Stock actual</th>
          <td mat-cell *matCellDef="let item" class="cell-stock">
            <span class="stock-num">{{ item.stock | number:'1.0-0' }}</span>
            <span class="stock-unit">{{ item.unidad || 'uds' }}</span>
            <span class="stock-pres" *ngIf="item.presentaciones?.length">
              ({{ convertToPres(item) }})
            </span>
          </td>
        </ng-container>

        <!-- Stock Mínimo -->
        <ng-container matColumnDef="minimo">
          <th mat-header-cell *matHeaderCellDef>Stock mínimo</th>
          <td mat-cell *matCellDef="let item" class="cell-stock">
            <span class="stock-num">{{ item.stock_minimo | number:'1.0-0' }}</span>
            <span class="stock-unit">{{ item.unidad || 'uds' }}</span>
          </td>
        </ng-container>

        <!-- Estado -->
        <ng-container matColumnDef="estado">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let item">
            <span class="estado-badge" [class.bajo]="item.estado === 'bajo'"
                  [class.sin-stock]="item.estado === 'sin_stock'"
                  [class.normal]="item.estado === 'normal'">
              {{ estadoLabel(item.estado) }}
            </span>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"
            [class.row-bajo]="row.estado === 'bajo'"
            [class.row-sin-stock]="row.estado === 'sin_stock'"></tr>
      </table>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 20px; }
    .page-header h1 { margin: 0 0 16px; font-size: 24px; font-weight: 600; }
    .filters { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 280px; }
    .estado-field { width: 180px; }
    .summary { display: flex; gap: 24px; margin-top: 12px; font-size: 14px; }
    .summary-item { padding: 6px 14px; background: #e8f5e9; border-radius: 6px; }
    .summary-item.warn { background: #fff3e0; }
    .summary-item.danger { background: #ffebee; }

    .table-container { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .inv-table { width: 100%; }
    .inv-table th { background: #fafafa; font-weight: 600; font-size: 13px; color: #555; }
    .inv-table td { padding: 12px 16px; }

    .cell-producto { display: flex; flex-direction: column; }
    .prod-name { font-weight: 500; }
    .prod-marca { font-size: 12px; color: #999; }

    .cell-stock { display: flex; align-items: baseline; gap: 4px; }
    .stock-num { font-weight: 700; font-size: 16px; }
    .stock-unit { font-size: 12px; color: #666; }
    .stock-pres { font-size: 11px; color: #1565c0; }

    .estado-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .estado-badge.normal { background: #e8f5e9; color: #2e7d32; }
    .estado-badge.bajo { background: #fff3e0; color: #e65100; }
    .estado-badge.sin-stock { background: #ffebee; color: #c62828; }

    .row-bajo { background: #fffcf5; }
    .row-sin-stock { background: #fff8f8; }

    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #999; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; margin-bottom: 12px; }
  `],
})
export default class InventarioComponent implements OnInit {
  private readonly reporteService = inject(ReporteService);

  readonly loading = signal(false);
  readonly items = signal<InventarioItem[]>([]);
  readonly searchTerm = signal('');
  filtroEstado: FiltroEstado = 'todos';

  readonly columns = ['producto', 'categoria', 'stock', 'minimo', 'estado'];

  readonly itemsBajo = computed(() =>
    this.items().filter((i) => i.estado === 'bajo').length
  );
  readonly itemsSinStock = computed(() =>
    this.items().filter((i) => i.estado === 'sin_stock').length
  );

  readonly filteredItems = computed(() => {
    let data = this.items();
    const term = this.searchTerm().toLowerCase().trim();

    if (this.filtroEstado !== 'todos') {
      data = data.filter((i) => i.estado === this.filtroEstado);
    }
    if (term) {
      data = data.filter(
        (i) =>
          i.producto.toLowerCase().includes(term) ||
          i.marca.toLowerCase().includes(term) ||
          String(i.codigoprod).includes(term)
      );
    }
    return data;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.reporteService.getInventario().subscribe({
      next: (data) => this.items.set(data),
      error: () => this.items.set([]),
      complete: () => this.loading.set(false),
    });
  }

  refresh(): void {
    this.loadData();
  }

  applyFilters(): void {
    // signals react automatically, nothing else needed
  }

  estadoLabel(estado: string): string {
    switch (estado) {
      case 'bajo': return 'Stock bajo';
      case 'sin_stock': return 'Sin stock';
      default: return 'Normal';
    }
  }

  convertToPres(item: InventarioItem): string {
    if (!item.presentaciones?.length || !item.stock) return '';
    const p = item.presentaciones[0];
    const cant = item.stock / p.cantidad_base;
    return `${cant.toFixed(1)} ${p.nombre}${cant !== 1 ? 's' : ''}`;
  }
}
