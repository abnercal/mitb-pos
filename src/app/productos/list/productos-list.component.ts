import { Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BaseListComponent } from '../../shared/components/base-list/base-list';
import { ProductoService } from '../../core/services/producto.service';
import { Producto } from '../../core/interfaces/producto.interface';
import ProductoFormComponent from '../form/producto-form.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-productos-list',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatPaginatorModule,
  ],
  template: `
    <div class="page-header">
      <h1>{{ title }}</h1>
      <button mat-raised-button color="primary" (click)="openCreate()">
        <mat-icon>add</mat-icon> Nuevo producto
      </button>
    </div>

    <mat-card>
      <mat-card-header>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar producto</mat-label>
          <input
            matInput
            [(ngModel)]="searchTerm"
            placeholder="Nombre, código o marca"
            (input)="onSearchChange()"
          />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </mat-card-header>
      <mat-card-content>
        <div class="table-responsive">
          <table mat-table [dataSource]="data()" class="full-table">
            <ng-container matColumnDef="codigo">
              <th mat-header-cell *matHeaderCellDef>Código</th>
              <td mat-cell *matCellDef="let item">
                <strong>{{ item.codigoprod }}</strong>
              </td>
            </ng-container>
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let item">{{ item.nombre }}</td>
            </ng-container>
            <ng-container matColumnDef="categoria">
              <th mat-header-cell *matHeaderCellDef>Categoría</th>
              <td mat-cell *matCellDef="let item">{{ item.Categoria?.nombre || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="marca">
              <th mat-header-cell *matHeaderCellDef>Marca</th>
              <td mat-cell *matCellDef="let item">{{ item.Marca?.nombre || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="presentaciones">
              <th mat-header-cell *matHeaderCellDef>Presentaciones</th>
              <td mat-cell *matCellDef="let item">
                @for (p of item.Presentaciones; track p; let last = $last) {
                  <span class="pres-chip">
                    {{ p.Presentacion?.nombre || '?' }} <small>(x{{ p.cantidad_base }})</small
                    >{{ last ? '' : ', ' }}
                  </span>
                }
                @if (!item.Presentaciones?.length) {
                  <span>—</span>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let item">
                <mat-chip [color]="item.estado ? 'primary' : 'warn'" highlighted>
                  {{ item.estado ? 'Activo' : 'Inactivo' }}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let item">
                <button
                  mat-icon-button
                  color="primary"
                  (click)="openEdit(item)"
                  matTooltip="Editar"
                >
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="delete(item)" matTooltip="Eliminar">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="columns.length">
                <div class="empty-state">
                  <mat-icon>inventory_2</mat-icon>
                  <p>{{ searchTerm() ? 'Sin resultados' : 'No hay productos registrados' }}</p>
                </div>
              </td>
            </tr>
          </table>
        </div>
        <mat-paginator
          [length]="totalItems()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[5, 10, 25, 50]"
          (page)="onPage($event)"
        >
        </mat-paginator>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .page-header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 500;
      }
      .search-field {
        width: 100%;
        max-width: 400px;
        margin: 16px 0 0 16px;
      }
      .full-table {
        width: 100%;
      }
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px;
        color: var(--mat-sys-on-surface-variant);
      }
      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
      }
      .pres-chip {
        font-size: 13px;
      }
    `,
  ],
})
export default class ProductosListComponent extends BaseListComponent<Producto> {
  override title = 'Productos';
  override entityName = 'productos';
  override formComponent = ProductoFormComponent;
  override dialogWidth = '650px';
  override columns = [
    'codigo',
    'nombre',
    'categoria',
    'marca',
    'presentaciones',
    'estado',
    'acciones',
  ];

  readonly searchTerm = signal('');

  private readonly productoService = inject(ProductoService);

  protected override buildParams(): { page: number; limit: number; search: string } {
    return { page: this.pageIndex() + 1, limit: this.pageSize(), search: this.searchTerm() };
  }

  protected override loadService(
    page: number,
    limit: number,
    search?: string,
  ): Observable<{ data: Producto[]; total: number }> {
    return this.productoService.getAll(page, limit, search);
  }

  protected override deleteService(id: number | string): Observable<void> {
    return this.productoService.delete(id as number);
  }

  protected override getId(item: Producto): number | string {
    return item.codigoprod!;
  }
  protected override getDisplayName(item: Producto): string {
    return item.nombre;
  }
}
