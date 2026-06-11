import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';

export interface DetalleItem {
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface DetalleDialogData {
  title: string;
  items: DetalleItem[];
  unitLabel: string;
}

@Component({
  selector: 'app-detalle-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTableModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <table mat-table [dataSource]="data.items" class="full-table">
        <ng-container matColumnDef="producto">
          <th mat-header-cell *matHeaderCellDef>Producto</th>
          <td mat-cell *matCellDef="let item">{{ item.producto }}</td>
        </ng-container>

        <ng-container matColumnDef="cantidad">
          <th mat-header-cell *matHeaderCellDef>Cant.</th>
          <td mat-cell *matCellDef="let item" class="txt-right">{{ item.cantidad }}</td>
        </ng-container>

        <ng-container matColumnDef="precio">
          <th mat-header-cell *matHeaderCellDef>{{ data.unitLabel }}</th>
          <td mat-cell *matCellDef="let item" class="txt-right">Q {{ item.precioUnitario | number:'.2' }}</td>
        </ng-container>

        <ng-container matColumnDef="subtotal">
          <th mat-header-cell *matHeaderCellDef>Subtotal</th>
          <td mat-cell *matCellDef="let item" class="txt-right"><strong>Q {{ item.subtotal | number:'.2' }}</strong></td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </mat-dialog-content>
  `,
  styles: [`
    .full-table { width: 100%; }
    .txt-right { text-align: right; }
    mat-dialog-content { min-width: 480px; }
  `],
})
export class DetalleDialog {
  readonly data = inject<DetalleDialogData>(MAT_DIALOG_DATA);
  readonly columns = ['producto', 'cantidad', 'precio', 'subtotal'];
}
