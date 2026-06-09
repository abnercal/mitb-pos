import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { ProductoService } from '../../core/services/producto.service';
import { Producto } from '../../core/interfaces/producto.interface';
import { ProductoFormComponent } from '../form/producto-form.component';

@Component({
  selector: 'app-productos-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>Productos</h1>
      <button mat-raised-button color="primary" (click)="openCreate()">
        <mat-icon>add</mat-icon> Nuevo producto
      </button>
    </div>

    <mat-card>
      <mat-card-header>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar producto</mat-label>
          <input matInput [(ngModel)]="searchTerm" placeholder="Nombre, código o marca">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="filteredData()" class="full-table">
          <ng-container matColumnDef="codigo">
            <th mat-header-cell *matHeaderCellDef>Código</th>
            <td mat-cell *matCellDef="let item"><strong>{{ item.codigoprod }}</strong></td>
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

          <ng-container matColumnDef="precio">
            <th mat-header-cell *matHeaderCellDef>Precio</th>
            <td mat-cell *matCellDef="let item"><strong>Q {{ (item.precio || 0) | number:'.2' }}</strong></td>
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
              <button mat-icon-button color="primary" (click)="openEdit(item)" matTooltip="Editar"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="delete(item)" matTooltip="Eliminar"><mat-icon>delete</mat-icon></button>
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
export default class ProductosListComponent implements OnInit {
  private readonly service = inject(ProductoService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly data = signal<Producto[]>([]);
  readonly searchTerm = signal('');
  readonly columns = ['codigo', 'nombre', 'categoria', 'marca', 'precio', 'estado', 'acciones'];

  readonly filteredData = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.data();
    return this.data().filter(p =>
      p.nombre.toLowerCase().includes(term) ||
      String(p.codigoprod).includes(term) ||
      (p.Marca?.nombre && p.Marca.nombre.toLowerCase().includes(term))
    );
  });

  ngOnInit(): void { this.load(); }
  private load(): void {
    this.service.getAll().subscribe({
      next: (res) => this.data.set(res),
      error: () => this.snackBar.open('Error al cargar productos', 'Cerrar', { duration: 3000 }),
    });
  }
  openCreate(): void {
    const ref = this.dialog.open(ProductoFormComponent, { width: '650px' });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }
  openEdit(item: Producto): void {
    const ref = this.dialog.open(ProductoFormComponent, { width: '650px', data: item });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }
  delete(item: Producto): void {
    if (!confirm(`¿Eliminar el producto "${item.nombre}"?`)) return;
    this.service.delete(item.codigoprod!).subscribe({
      next: () => { this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 2000 }); this.load(); },
      error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 }),
    });
  }
}
