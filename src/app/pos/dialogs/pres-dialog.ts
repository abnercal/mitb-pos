import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Producto } from '../../core/interfaces/producto.interface';
import { ProductoPresentacion } from '../../core/interfaces/producto-presentacion.interface';

@Component({
  selector: 'app-pos-pres-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.producto.nombre }}</h2>
    <mat-dialog-content>
      <p class="pres-hint">Elegí la presentación para agregar al carrito:</p>
      <div class="pres-list">
        @for (pp of data.presentaciones; track pp) {
          <button class="pres-btn" (click)="select(pp)">
            <span class="pres-name">{{ pp.Presentacion?.nombre || 'Presentación' }}</span>
            <span class="pres-qty"
              >x{{ pp.cantidad_base }} {{ data.producto.Unidad?.nombre || 'unid' }}</span
            >
            <span class="pres-price">Q {{ pp.precio_venta || 0 | number: '.2' }}</span>
          </button>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .pres-hint {
        margin: 0 0 16px;
        color: #666;
      }
      .pres-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .pres-btn {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        background: #fff;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s;
        width: 100%;
      }
      .pres-btn:hover {
        border-color: var(--mat-sys-primary);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--mat-sys-primary) 15%, transparent);
      }
      .pres-name {
        flex: 1;
        font-weight: 600;
        font-size: 15px;
      }
      .pres-qty {
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
        background: var(--mat-sys-surface-container);
        padding: 2px 10px;
        border-radius: 4px;
      }
      .pres-price {
        font-weight: 700;
        font-size: 16px;
        color: var(--mat-sys-primary);
      }
    `,
  ],
})
export class PosPresDialog {
  readonly data = inject<{
    producto: Producto;
    presentaciones: ProductoPresentacion[];
  }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PosPresDialog>);

  select(pp: ProductoPresentacion): void {
    this.dialogRef.close(pp);
  }
}
