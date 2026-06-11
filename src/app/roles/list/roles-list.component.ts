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
import { RolService } from '../../core/services/rol.service';
import { Rol } from '../../core/interfaces/rol.interface';
import { RolesFormComponent } from '../form/roles-form.component';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatPaginatorModule, MatCardModule, MatChipsModule, MatDialogModule, MatSnackBarModule],
  template: `
    <div class="page-header">
      <h1>Roles</h1>
      <button mat-raised-button color="primary" (click)="openForm()"><mat-icon>add</mat-icon> Nuevo rol</button>
    </div>
    <mat-card>
      <mat-card-content>
        <table mat-table [dataSource]="data()" class="full-table">
          <ng-container matColumnDef="nombrerol">
            <th mat-header-cell *matHeaderCellDef>Rol</th>
            <td mat-cell *matCellDef="let item"><strong>{{ item.nombrerol }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="permisos">
            <th mat-header-cell *matHeaderCellDef>Permisos</th>
            <td mat-cell *matCellDef="let item">
              <mat-chip *ngFor="let p of (item.Permisos || [])" class="perm-chip">{{ p.nombre }}</mat-chip>
              <span *ngIf="!item.Permisos?.length">—</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let item">
              <button mat-icon-button (click)="openForm(item)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button (click)="delete(item)" color="warn"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td [attr.colspan]="columns.length"><div class="empty-state"><mat-icon>admin_panel_settings</mat-icon><p>No hay roles</p></div></td>
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
    .perm-chip { margin: 2px; font-size: 12px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
  `],
})
export default class RolesListComponent implements OnInit {
  private readonly service = inject(RolService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = signal<Rol[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly columns = ['nombrerol', 'permisos', 'acciones'];

  ngOnInit(): void { this.load(); }

  private load(): void {
    const page = this.pageIndex() + 1;
    const limit = this.pageSize();
    this.service.getAll(page, limit).subscribe({
      next: (r) => {
        this.data.set(r.data);
        this.totalItems.set(r.total);
      },
      error: () => this.snackBar.open('Error al cargar roles', 'Cerrar', { duration: 3000 }),
    });
  }

  openForm(rol?: Rol): void {
    const ref = this.dialog.open(RolesFormComponent, { width: '500px', data: { rol: rol || null } });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }

  onPage(e: { pageIndex: number; pageSize: number }): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  delete(r: Rol): void {
    if (!confirm(`¿Eliminar rol ${r.nombrerol}?`)) return;
    this.service.delete(r._id!).subscribe({
      next: () => { this.snackBar.open('Rol eliminado', 'Cerrar', { duration: 2000 }); this.load(); },
      error: () => this.snackBar.open('Error al eliminar rol', 'Cerrar', { duration: 3000 }),
    });
  }
}
