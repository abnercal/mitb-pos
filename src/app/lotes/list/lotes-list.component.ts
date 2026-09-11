import { Component, OnInit, inject, signal } from '@angular/core';
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
import { LotePorVencer, ResumenPorVencer, UrgenciaLote } from '../../core/interfaces/lote.interface';

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

    @if (resumen(); as r) {
      <div class="summary">
        <span class="summary-item">Total: <strong>{{ r.total }}</strong></span>
        <span class="summary-item danger">Vencidos: <strong>{{ r.vencido }}</strong></span>
        <span class="summary-item warn">Críticos (≤7d): <strong>{{ r.critico }}</strong></span>
        <span class="summary-item">Próximos: <strong>{{ r.proximo }}</strong></span>
      </div>
    }

    @if (loading()) {
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }

    <mat-card>
      <mat-card-content>
        <div class="table-responsive">
          <table mat-table [dataSource]="lotes()" class="full-table">
            <ng-container matColumnDef="producto">
              <th mat-header-cell *matHeaderCellDef>Producto</th>
              <td mat-cell *matCellDef="let item">
                <div class="cell-producto">
                  <span class="prod-name">{{ item.producto || '—' }}</span>
                  <span class="prod-marca">{{ item.marca }}</span>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="sucursal">
              <th mat-header-cell *matHeaderCellDef>Sucursal</th>
              <td mat-cell *matCellDef="let item">{{ item.sucursal || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="cantidad">
              <th mat-header-cell *matHeaderCellDef>Cantidad disponible</th>
              <td mat-cell *matCellDef="let item">
                {{ item.cantidad_disponible | number: '1.0-2' }} {{ item.unidad }}
              </td>
            </ng-container>
            <ng-container matColumnDef="dias">
              <th mat-header-cell *matHeaderCellDef>Días restantes</th>
              <td mat-cell *matCellDef="let item">{{ diasLabel(item.dias_restantes) }}</td>
            </ng-container>
            <ng-container matColumnDef="vencimiento">
              <th mat-header-cell *matHeaderCellDef>Fecha de vencimiento</th>
              <td mat-cell *matCellDef="let item">
                <mat-chip [class]="chipClass(item.urgencia)" highlighted>
                  {{ item.fecha_vencimiento | date: 'shortDate' }}
                </mat-chip>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: columns"
              [class.row-vencido]="row.urgencia === 'vencido'"
              [class.row-critico]="row.urgencia === 'critico'"
            ></tr>
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
    .summary { display: flex; gap: 16px; margin-bottom: 16px; font-size: 14px; flex-wrap: wrap; }
    .summary-item { padding: 6px 14px; background: var(--mat-sys-surface-container-low); border-radius: 6px; }
    .summary-item.warn { background: #fff3e0; }
    .summary-item.danger { background: var(--mat-sys-error-container); }
    .full-table { width: 100%; }
    .cell-producto { display: flex; flex-direction: column; }
    .prod-name { font-weight: 500; }
    .prod-marca { font-size: 12px; color: var(--mat-sys-on-surface-variant); }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px; color: var(--mat-sys-on-surface-variant); }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
    .row-vencido { background: var(--mat-sys-error-container); }
    .row-critico { background: #fffcf5; }
    .chip-vencido { --mdc-chip-elevated-container-color: var(--mat-sys-error); --mdc-chip-label-text-color: var(--mat-sys-on-error); }
    .chip-critico { --mdc-chip-elevated-container-color: var(--mat-sys-error-container); --mdc-chip-label-text-color: var(--mat-sys-on-error-container); }
    .chip-proximo { --mdc-chip-elevated-container-color: var(--mat-sys-secondary-container); --mdc-chip-label-text-color: var(--mat-sys-on-secondary-container); }
    :host-context(:root.dark) .summary-item.warn { background: var(--mat-sys-error-container); }
    :host-context(:root.dark) .row-critico { background: var(--mat-sys-surface-container-high); }
  `],
})
export default class LotesListComponent implements OnInit {
  private readonly loteService = inject(LoteService);

  readonly loading = signal(false);
  readonly lotes = signal<LotePorVencer[]>([]);
  readonly resumen = signal<ResumenPorVencer | null>(null);
  dias = 30;

  readonly columns = ['producto', 'sucursal', 'cantidad', 'dias', 'vencimiento'];

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.loteService.getPorVencer(this.dias).subscribe({
      next: ({ data, meta }) => {
        this.lotes.set(data);
        this.resumen.set(meta ?? null);
      },
      error: () => {
        this.lotes.set([]);
        this.resumen.set(null);
      },
      complete: () => this.loading.set(false),
    });
  }

  /** Clase del chip de fecha según la urgencia que ya calcula el API. */
  chipClass(urgencia: UrgenciaLote): string {
    return `chip-${urgencia}`;
  }

  diasLabel(dias: number): string {
    if (dias < 0) return `Vencido hace ${-dias}d`;
    if (dias === 0) return 'Vence hoy';
    return `${dias}d`;
  }
}
