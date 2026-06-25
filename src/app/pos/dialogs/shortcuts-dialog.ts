import { Component } from '@angular/core';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pos-shortcuts-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align:middle;margin-right:8px">keyboard</mat-icon>
      Atajos de teclado
    </h2>
    <mat-dialog-content>
      <div class="shortcut-row"><kbd>F1</kbd><span>Mostrar esta ayuda</span></div>
      <div class="shortcut-row"><kbd>?</kbd><span>Mostrar esta ayuda</span></div>
      <div class="shortcut-row"><kbd>Ctrl + N</kbd><span>Nueva venta</span></div>
      <div class="shortcut-row"><kbd>↑</kbd> <kbd>↓</kbd><span>Navegar productos</span></div>
      <div class="shortcut-row"><kbd>Enter</kbd><span>Agregar producto seleccionado</span></div>
      <div class="shortcut-row"><kbd>Esc</kbd><span>Limpiar búsqueda / cerrar carrito</span></div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .shortcut-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
      }
      .shortcut-row kbd {
        display: inline-block;
        min-width: 48px;
        text-align: center;
        padding: 4px 10px;
        font-size: 13px;
        font-family: monospace;
        background: var(--mat-sys-surface-container);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 4px;
      }
      .shortcut-row span {
        color: #555;
      }
    `,
  ],
})
export class PosShortcutsDialog {}
