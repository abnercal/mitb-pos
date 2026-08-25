import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TipoPagoService } from '../../core/services/tipo-pago.service';
import { TipoPago } from '../../core/interfaces/tipo-pago.interface';
import { Venta } from '../../core/interfaces/venta.interface';
import { RegistrarPagoBody } from '../../core/services/venta.service';

export interface RegistrarPagoDialogData {
  venta: Venta;
}

@Component({
  selector: 'app-registrar-pago-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Registrar abono</h2>
    <mat-dialog-content>
      @if (data.venta.saldoPendiente != null) {
        <p class="saldo-hint">Saldo pendiente: <strong>Q {{ data.venta.saldoPendiente | number: '.2' }}</strong></p>
      }
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Importe</mat-label>
        <input matInput type="number" step="0.01" min="0.01" [(ngModel)]="importe" [ngModelOptions]="{ standalone: true }" />
        <span matTextPrefix>Q&nbsp;</span>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Tipo de pago</mat-label>
        <mat-select [(value)]="idtipopago">
          @for (t of tiposPago; track t) {
            <mat-option [value]="t.idtipopago">{{ t.nombre }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Estado</mat-label>
        <mat-select [(value)]="estado">
          <mat-option value="pagado">Pagado</mat-option>
          <mat-option value="Pendiente">Pendiente</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!importe || importe <= 0 || idtipopago == null"
        (click)="submit()"
      >
        Registrar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .saldo-hint { margin: 0 0 16px; color: var(--mat-sys-on-surface-variant); }
    mat-dialog-content { min-width: 320px; }
  `],
})
export class RegistrarPagoDialog implements OnInit {
  readonly data = inject<RegistrarPagoDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RegistrarPagoDialog>);
  private readonly tipoPagoService = inject(TipoPagoService);

  tiposPago: TipoPago[] = [];
  importe: number = this.data.venta.saldoPendiente ?? 0;
  idtipopago: number | null = null;
  estado = 'pagado';

  ngOnInit(): void {
    this.tipoPagoService.getAll().subscribe((r) => {
      this.tiposPago = r;
      if (this.idtipopago == null && r.length) this.idtipopago = r[0].idtipopago;
    });
  }

  submit(): void {
    if (!this.importe || this.importe <= 0 || this.idtipopago == null) return;
    const body: RegistrarPagoBody = {
      importe: this.importe,
      idtipopago: this.idtipopago,
      estado: this.estado,
    };
    this.dialogRef.close(body);
  }
}
