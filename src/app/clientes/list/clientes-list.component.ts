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
import { MatPaginatorModule } from '@angular/material/paginator';
import { ClienteService } from '../../core/services/cliente.service';
import { Cliente } from '../../core/interfaces/cliente.interface';
import { ClienteFormComponent } from '../form/cliente-form.component';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatDialogModule, MatSnackBarModule, MatPaginatorModule,
  ],
  template: `
    <div class="page-header">
      <h1>Clientes</h1>
      <button mat-raised-button color="primary" (click)="openCreate()">
        <mat-icon>add</mat-icon> Nuevo cliente
      </button>
    </div>

    <mat-card>
      <mat-card-header>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar cliente</mat-label>
          <input matInput [(ngModel)]="searchTerm" placeholder="Nombre, teléfono o NIT" (input)="onSearchChange()">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </mat-card-header>

      <mat-card-content>
        <table mat-table [dataSource]="data()" class="full-table">
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let item"><strong>{{ item.nombres }} {{ item.apellidos }}</strong></td>
          </ng-container>

          <ng-container matColumnDef="nit">
            <th mat-header-cell *matHeaderCellDef>NIT</th>
            <td mat-cell *matCellDef="let item">{{ item.nit || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="telefono">
            <th mat-header-cell *matHeaderCellDef>Teléfono</th>
            <td mat-cell *matCellDef="let item">{{ item.telefono || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef>Tipo</th>
            <td mat-cell *matCellDef="let item">
              <mat-chip highlighted>{{ item.tipoClie?.nombre || '—' }}</mat-chip>
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
              <button mat-icon-button color="primary" (click)="openEdit(item)" matTooltip="Editar"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="delete(item)" matTooltip="Eliminar"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell" [attr.colspan]="columns.length">
              <div class="empty-state">
                <mat-icon>people_outline</mat-icon>
                <p>{{ searchTerm() ? 'Sin resultados' : 'No hay clientes registrados' }}</p>
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
export default class ClientesListComponent implements OnInit {
  private readonly service = inject(ClienteService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly data = signal<Cliente[]>([]);
  readonly totalItems = signal(0);
  readonly searchTerm = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly columns = ['nombre', 'nit', 'telefono', 'tipo', 'estado', 'acciones'];

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
      next: (res) => {
        this.data.set(res.data);
        this.totalItems.set(res.total);
      },
      error: () => this.snackBar.open('Error al cargar clientes', 'Cerrar', { duration: 3000 }),
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(ClienteFormComponent, { width: '600px' });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }
  openEdit(item: Cliente): void {
    const ref = this.dialog.open(ClienteFormComponent, { width: '600px', data: item });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }
  delete(item: Cliente): void {
    if (!confirm(`¿Eliminar al cliente "${item.nombres} ${item.apellidos || ''}"?`)) return;
    this.service.delete(item._id!).subscribe({
      next: () => { this.snackBar.open('Cliente eliminado', 'Cerrar', { duration: 2000 }); this.load(); },
      error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 }),
    });
  }
}
