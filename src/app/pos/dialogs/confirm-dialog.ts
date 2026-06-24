import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-pos-confirm',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirmar venta</h2>
    <mat-dialog-content>
      <p>¿Cobrar <strong>Q {{ data.total | number:'.2' }}</strong> con <strong>{{ data.items }} producto{{ data.items !== 1 ? 's' : '' }}</strong>?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true">Cobrar</button>
    </mat-dialog-actions>
  `,
})
export class PosConfirmDialog {
  readonly data = inject<{ total: number; items: number }>(MAT_DIALOG_DATA);
}
