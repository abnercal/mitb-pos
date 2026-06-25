import { Component, inject } from '@angular/core';

import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-delete',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirmar eliminación</h2>
    <mat-dialog-content>
      <p>
        ¿Eliminar <strong>"{{ data.name }}"</strong>?
      </p>
      <p class="warning-text">Esta acción no se puede deshacer.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Eliminar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .warning-text {
        font-size: 12px;
        color: var(--mat-sys-error);
        margin-top: -8px;
      }
    `,
  ],
})
export class ConfirmDeleteDialog {
  readonly data = inject<{ name: string }>(MAT_DIALOG_DATA);
}
