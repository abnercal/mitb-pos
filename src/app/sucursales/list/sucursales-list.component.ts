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
import { SucursalService } from '../../core/services/sucursal.service';
import { Sucursal } from '../../core/interfaces/sucursal.interface';
import { SucursalesFormComponent } from '../form/sucursales-form.component';

@Component({
  selector: 'app-sucursales-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatPaginatorModule, MatCardModule, MatChipsModule, MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>Sucursales</h1>
      <button mat-raised-button color="primary" (click)="openForm()"><mat-icon>add</mat-icon> Nueva sucursal</button>
    </div>
    <mat-card>
      <mat-card-content>
        <div class="table-responsive">
        <table mat-table [dataSource]="data()" class="full-table">
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let item"><strong>{{ item.nombre }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="direccion">
            <th mat-header-cell *matHeaderCellDef>Dirección</th>
            <td mat-cell *matCellDef="let item">{{ item.direccion || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="telefono">
            <th mat-header-cell *matHeaderCellDef>Teléfono</th>
            <td mat-cell *matCellDef="let item">{{ item.telefono || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="principal">
            <th mat-header-cell *matHeaderCellDef>Principal</th>
            <td mat-cell *matCellDef="let item"><mat-chip highlighted>{{ item.es_principal ? 'Sí' : 'No' }}</mat-chip></td>
          </ng-container>
          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let item">
              <mat-chip [color]="item.estado ? 'primary' : 'warn'" highlighted>{{ item.estado ? 'Activa' : 'Inactiva' }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let item">
              <button mat-icon-button (click)="openForm(item)"><mat-icon>edit</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td [attr.colspan]="columns.length"><div class="empty-state"><mat-icon>store</mat-icon><p>No hay sucursales</p></div></td>
          </tr>
        </table>
        </div>

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
export default class SucursalesListComponent implements OnInit {
  private readonly service = inject(SucursalService);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = signal<Sucursal[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  private readonly dialog = inject(MatDialog);
  readonly columns = ['nombre', 'direccion', 'telefono', 'principal', 'estado', 'acciones'];
  ngOnInit(): void { this.load(); }
  private load(): void {
    const page = this.pageIndex() + 1;
    const limit = this.pageSize();
    this.service.getAll(page, limit).subscribe({
      next: (r) => {
        this.data.set(r.data);
        this.totalItems.set(r.total);
      },
      error: () => this.snackBar.open('Error al cargar sucursales', 'Cerrar', { duration: 3000 }),
    });
  }
  onPage(e: { pageIndex: number; pageSize: number }): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  openForm(sucursal?: Sucursal): void {
    const ref = this.dialog.open(SucursalesFormComponent, { width: '500px', data: { sucursal: sucursal || null } });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }
}
