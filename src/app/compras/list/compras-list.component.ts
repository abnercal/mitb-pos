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
import { CompraService } from '../../core/services/compra.service';
import { Compra } from '../../core/interfaces/compra.interface';
import { CompraFormComponent } from '../form/compra-form.component';

@Component({
  selector: 'app-compras-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatDialogModule, MatSnackBarModule,
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
          <input matInput [(ngModel)]="searchTerm" placeholder="Proveedor o referencia">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="filteredData()" class="full-table">
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
  readonly searchTerm = signal('');
  readonly columns = ['nombre', 'proveedor', 'fecha', 'total', 'estado', 'acciones'];

  readonly filteredData = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.data();
    return this.data().filter(c =>
      c.nombre.toLowerCase().includes(term) ||
      (c.Proveedor?.nombre && c.Proveedor.nombre.toLowerCase().includes(term))
    );
  });

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.service.getAll().subscribe({
      next: (r) => this.data.set(r),
      error: () => this.snackBar.open('Error al cargar compras', 'Cerrar', { duration: 3000 }),
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(CompraFormComponent, { width: '750px', disableClose: true });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }

  anular(item: Compra): void {
    if (!confirm(`¿Anular la compra "${item.nombre}"?`)) return;
    this.service.anular(item._id!).subscribe({
      next: () => { this.snackBar.open('Compra anulada', 'Cerrar', { duration: 2000 }); this.load(); },
      error: () => this.snackBar.open('Error al anular', 'Cerrar', { duration: 3000 }),
    });
  }
}
