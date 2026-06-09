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
import { ProveedorService } from '../../core/services/proveedor.service';
import { Proveedor } from '../../core/interfaces/proveedor.interface';
import { ProveedorFormComponent } from '../form/proveedor-form.component';

@Component({
  selector: 'app-proveedores-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>Proveedores</h1>
      <button mat-raised-button color="primary" (click)="openCreate()">
        <mat-icon>add</mat-icon> Nuevo proveedor
      </button>
    </div>

    <mat-card>
      <mat-card-header>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar proveedor</mat-label>
          <input matInput [(ngModel)]="searchTerm" placeholder="Nombre, teléfono o NIT">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </mat-card-header>

      <mat-card-content>
        <table mat-table [dataSource]="filteredData()" class="full-table">
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let item"><strong>{{ item.nombre }}</strong></td>
          </ng-container>

          <ng-container matColumnDef="telefono">
            <th mat-header-cell *matHeaderCellDef>Teléfono</th>
            <td mat-cell *matCellDef="let item">{{ item.telefono || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="nit">
            <th mat-header-cell *matHeaderCellDef>NIT</th>
            <td mat-cell *matCellDef="let item">{{ item.nit || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let item">{{ item.email || '—' }}</td>
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
                <mat-icon>local_shipping</mat-icon>
                <p>{{ searchTerm() ? 'Sin resultados para "' + searchTerm() + '"' : 'No hay proveedores registrados' }}</p>
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
export default class ProveedoresListComponent implements OnInit {
  private readonly service = inject(ProveedorService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly data = signal<Proveedor[]>([]);
  readonly searchTerm = signal('');
  readonly columns = ['nombre', 'telefono', 'nit', 'email', 'estado', 'acciones'];

  readonly filteredData = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.data();
    return this.data().filter(p =>
      p.nombre.toLowerCase().includes(term) ||
      (p.telefono && p.telefono.includes(term)) ||
      (p.nit && p.nit.toLowerCase().includes(term))
    );
  });

  ngOnInit(): void { this.load(); }
  private load(): void {
    this.service.getAll().subscribe({
      next: (res) => this.data.set(res),
      error: () => this.snackBar.open('Error al cargar proveedores', 'Cerrar', { duration: 3000 }),
    });
  }
  openCreate(): void {
    const ref = this.dialog.open(ProveedorFormComponent, { width: '550px' });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }
  openEdit(item: Proveedor): void {
    const ref = this.dialog.open(ProveedorFormComponent, { width: '550px', data: item });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }
  delete(item: Proveedor): void {
    if (!confirm(`¿Eliminar el proveedor "${item.nombre}"?`)) return;
    this.service.delete(item._id!).subscribe({
      next: () => { this.snackBar.open('Proveedor eliminado', 'Cerrar', { duration: 2000 }); this.load(); },
      error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 }),
    });
  }
}
