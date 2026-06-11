import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UnidadService } from '../../core/services/unidad.service';
import { Unidad } from '../../core/interfaces/unidad.interface';
import { UnidadFormComponent } from '../form/unidad-form.component';

@Component({
  selector: 'app-unidades-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatPaginatorModule, MatCardModule, MatChipsModule, MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>Unidades de Medida</h1>
      <button mat-raised-button color="primary" (click)="openCreate()">
        <mat-icon>add</mat-icon> Nueva unidad
      </button>
    </div>

    <mat-card>
      <mat-card-content>
        <table mat-table [dataSource]="data()" class="full-table">
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let item">{{ item.nombre }}</td>
          </ng-container>

          <ng-container matColumnDef="abreviatura">
            <th mat-header-cell *matHeaderCellDef>Abreviatura</th>
            <td mat-cell *matCellDef="let item"><strong>{{ item.abreviatura }}</strong></td>
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
              <div class="empty-state"><mat-icon>straighten</mat-icon><p>No hay unidades registradas</p></div>
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
    .full-table { width: 100%; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
  `],
})
export default class UnidadesListComponent implements OnInit {
  private readonly service = inject(UnidadService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = signal<Unidad[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly columns = ['nombre', 'abreviatura', 'estado', 'acciones'];

  ngOnInit(): void { this.load(); }
  private load(): void {
    const page = this.pageIndex() + 1;
    const limit = this.pageSize();
    this.service.getAll(page, limit).subscribe({
      next: (res) => {
        this.data.set(res.data);
        this.totalItems.set(res.total);
      },
      error: () => this.snackBar.open('Error al cargar unidades', 'Cerrar', { duration: 3000 }),
    });
  }
  openCreate(): void {
    const ref = this.dialog.open(UnidadFormComponent, { width: '450px' });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }
  openEdit(item: Unidad): void {
    const ref = this.dialog.open(UnidadFormComponent, { width: '450px', data: item });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }
  onPage(e: { pageIndex: number; pageSize: number }): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  delete(item: Unidad): void {
    if (!confirm(`¿Eliminar la unidad "${item.nombre}"?`)) return;
    this.service.delete(item._id!).subscribe({
      next: () => { this.snackBar.open('Unidad eliminada', 'Cerrar', { duration: 2000 }); this.load(); },
      error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 }),
    });
  }
}
