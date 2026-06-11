import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PermisoService } from '../../core/services/permiso.service';
import { Permiso } from '../../core/interfaces/permiso.interface';
import { PermisoFormComponent } from '../form/permiso-form.component';

@Component({
  selector: 'app-permisos-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatPaginatorModule, MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>Permisos</h1>
      <button mat-raised-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Nuevo permiso
      </button>
    </div>
    <mat-card>
      <mat-card-content>
        <table mat-table [dataSource]="data()" class="full-table">
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Permiso</th>
            <td mat-cell *matCellDef="let item">{{ item.nombre }}</td>
          </ng-container>
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let item">
              <button mat-icon-button (click)="openForm(item)" matTooltip="Editar"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button (click)="delete(item)" color="warn" matTooltip="Eliminar"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td [attr.colspan]="columns.length"><div class="empty-state"><mat-icon>vpn_key</mat-icon><p>No hay permisos</p></div></td>
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
export default class PermisosListComponent implements OnInit {
  private readonly service = inject(PermisoService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly data = signal<Permiso[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly columns = ['nombre', 'acciones'];

  ngOnInit(): void { this.load(); }

  private load(): void {
    const page = this.pageIndex() + 1;
    const limit = this.pageSize();
    this.service.getAll(page, limit).subscribe({
      next: (r) => {
        this.data.set(r.data);
        this.totalItems.set(r.total);
      },
      error: () => this.snackBar.open('Error al cargar permisos', 'Cerrar', { duration: 3000 }),
    });
  }

  onPage(e: { pageIndex: number; pageSize: number }): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  openForm(permiso?: Permiso): void {
    const ref = this.dialog.open(PermisoFormComponent, { width: '450px', data: permiso || null });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }

  delete(p: Permiso): void {
    if (!confirm(`¿Eliminar el permiso "${p.nombre}"?`)) return;
    this.service.delete(p._id!).subscribe({
      next: () => { this.snackBar.open('Permiso eliminado', 'Cerrar', { duration: 2000 }); this.load(); },
      error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 }),
    });
  }
}
