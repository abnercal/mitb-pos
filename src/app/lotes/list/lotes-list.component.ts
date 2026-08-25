import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoteService } from '../../core/services/lote.service';
import { Lote } from '../../core/interfaces/lote.interface';

@Component({
  selector: 'app-lotes-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>Lotes por vencer</h1>
      <div class="filters">
        <mat-form-field appearance="outline" class="dias-field">
          <mat-label>Días</mat-label>
          <input matInput type="number" min="1" [(ngModel)]="dias" (change)="refresh()" />
        </mat-form-field>
        <button mat-stroked-button (click)="refresh()">
          <mat-icon>refresh</mat-icon> Actualizar
        </button>
      </div>
    </div>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }

    <mat-card>
      <mat-card-content>
        <div class="table-responsive">
          <table mat-table [dataSource]="lotes()" class="full-table">
            <ng-container matColumnDef="producto">
              <th mat-header-cell *matHeaderCellDef>Producto</th>
              <td mat-cell *matCellDef="let item">{{ item.Producto?.nombre || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="sucursal">
              <th mat-header-cell *matHeaderCellDef>Sucursal</th>
              <td mat-cell *matCellDef="let item">{{ item.Sucursal?.nombre || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="cantidad">
              <th mat-header-cell *matHeaderCellDef>Cantidad disponible</th>
              <td mat-cell *matCellDef="let item">{{ item.cantidad_disponible | number: '1.0-2' }}</td>
            </ng-container>
            <ng-container matColumnDef="vencimiento">
              <th mat-header-cell *matHeaderCellDef>Fecha de vencimiento</th>
              <td mat-cell *matCellDef="let item">
                <mat-chip [class]="chipClass(item)" highlighted>
                  {{ item.fecha_vencimiento | date: 'shortDate' }}
                </mat-chip>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="columns.length">
                <div class="empty-state">
                  <mat-icon>inventory_2</mat-icon>
                  <p>No hay lotes por vencer en los próximos {{ dias }} días</p>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .filters { display: flex; gap: 12px; align-items: center; }
    .dias-field { width: 100px; }
    .full-table { width: 100%; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px; color: var(--mat-sys-on-surface-variant); }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
    .chip-warn { --mdc-chip-elevated-container-color: var(--mat-sys-error-container); --mdc-chip-label-text-color: var(--mat-sys-on-error-container); }
    .chip-info { --mdc-chip-elevated-container-color: var(--mat-sys-secondary-container); --mdc-chip-label-text-color: var(--mat-sys-on-secondary-container); }
  `],
})
export default class LotesListComponent implements OnInit {
  private readonly loteService = inject(LoteService);

  readonly loading = signal(false);
  readonly lotes = signal<Lote[]>([]);
  dias = 30;

  readonly columns = ['producto', 'sucursal', 'cantidad', 'vencimiento'];

  private readonly hoy = computed(() => new Date());

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.loteService.getPorVencer(this.dias).subscribe({
      next: (data) => this.lotes.set(data),
      error: () => this.lotes.set([]),
      complete: () => this.loading.set(false),
    });
  }

  /** Chip rojo si vence en 7 días o menos, informativo en caso contrario. */
  chipClass(item: Lote): string {
    const dias = Math.ceil(
      (new Date(item.fecha_vencimiento).getTime() - this.hoy().getTime()) / (1000 * 60 * 60 * 24),
    );
    return dias <= 7 ? 'chip-warn' : 'chip-info';
  }
}
