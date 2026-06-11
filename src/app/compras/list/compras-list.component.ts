import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CompraService } from '../../core/services/compra.service';
import { Compra } from '../../core/interfaces/compra.interface';
import { CompraFormComponent } from '../form/compra-form.component';
import { DetalleDialog, DetalleItem } from '../../shared/components/detalle-dialog.component';

@Component({
  selector: 'app-compras-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatDialogModule, MatSnackBarModule, MatTooltipModule, MatPaginatorModule,
  ],
  template: `
    <div class="page-header">
      <h1>Compras</h1>
      <button mat-raised-button color="primary" (click)="openCreate()">
        <mat-icon>add</mat-icon> Nueva compra
      </button>
    </div>

    <mat-card>
      <mat-card-header>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar compra</mat-label>
          <input matInput [(ngModel)]="searchTerm" placeholder="Proveedor o referencia" (input)="onSearchChange()">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="data()" class="full-table">
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Referencia</th>
            <td mat-cell *matCellDef="let item"><strong>{{ item.nombre }}</strong></td>
          </ng-container>

          <ng-container matColumnDef="proveedor">
            <th mat-header-cell *matHeaderCellDef>Proveedor</th>
            <td mat-cell *matCellDef="let item">{{ item.Proveedor?.nombre || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let item">{{ (item.fecha || item.createdAt) | date:'shortDate' }}</td>
          </ng-container>

          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let item"><strong>Q {{ (item.total || 0) | number:'.2' }}</strong></td>
          </ng-container>

          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let item">
              <mat-chip [color]="item.estado ? 'primary' : 'warn'" highlighted>
                {{ item.estado ? 'Activa' : 'Anulada' }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="detalle">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let item">
              <button mat-icon-button (click)="openDetalle(item)" matTooltip="Ver detalle"><mat-icon>visibility</mat-icon></button>
            </td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let item">
              <button mat-icon-button color="warn" (click)="anular(item)" matTooltip="Anular"><mat-icon>cancel</mat-icon></button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell" [attr.colspan]="columns.length">
              <div class="empty-state">
                <mat-icon>shopping_cart</mat-icon>
                <p>{{ searchTerm() ? 'Sin resultados' : 'No hay compras registradas' }}</p>
              </div>
            </td>
          </tr>
        </table>
        <mat-paginator [length]="totalItems()" [pageSize]="pageSize()"
          [pageSizeOptions]="[5, 10, 25, 50]" (page)="onPage($event)">
        </mat-paginator>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .search-field { width: 100%; max-width: 400px; margin: 16px 0 0 16px; }
    .full-table { width: 100%; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
  `],
})
export default class ComprasListComponent implements OnInit {
  private readonly service = inject(CompraService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly data = signal<Compra[]>([]);
  readonly totalItems = signal(0);
  readonly searchTerm = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly columns = ['nombre', 'proveedor', 'fecha', 'total', 'estado', 'detalle', 'acciones'];

  onSearchChange(): void {
    this.pageIndex.set(0);
    this.load();
  }

  onPage(e: { pageIndex: number; pageSize: number }): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  ngOnInit(): void { this.load(); }

  private load(): void {
    const page = this.pageIndex() + 1;
    const limit = this.pageSize();
    const search = this.searchTerm();
    this.service.getAll(page, limit, search).subscribe({
      next: (r) => {
        this.data.set(r.data);
        this.totalItems.set(r.total);
      },
      error: () => this.snackBar.open('Error al cargar compras', 'Cerrar', { duration: 3000 }),
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(CompraFormComponent, { width: '750px', disableClose: true });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openDetalle(item: Compra): void {
    const items: DetalleItem[] = (item.Detalles || []).map(d => ({
      producto: (d.ProductoPresentacion?.Producto?.nombre || 'Producto') +
                (d.ProductoPresentacion?.Presentacion?.nombre ? ` - ${d.ProductoPresentacion.Presentacion.nombre}` : ''),
      cantidad: d.cantidad,
      precioUnitario: Number(d.costo),
      subtotal: Number(d.cantidad) * Number(d.costo),
    }));
    this.dialog.open(DetalleDialog, {
      width: '600px',
      data: { title: `Detalle: ${item.nombre}`, items, unitLabel: 'Costo' },
    });
  }

  anular(item: Compra): void {
    if (!confirm(`¿Anular la compra "${item.nombre}"?`)) return;
    this.service.anular(item._id!).subscribe({
      next: () => { this.snackBar.open('Compra anulada', 'Cerrar', { duration: 2000 }); this.load(); },
      error: () => this.snackBar.open('Error al anular', 'Cerrar', { duration: 3000 }),
    });
  }
}
