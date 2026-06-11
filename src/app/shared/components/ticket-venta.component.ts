import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Venta } from '../../core/interfaces/venta.interface';

@Component({
  selector: 'app-ticket-venta',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="print-wrapper">
      <!-- Ticket Content -->
      <div class="ticket" #ticketContent>
        <div class="ticket-header">
          <h1>MITB POS</h1>
          <p class="ticket-type">TICKET DE VENTA</p>
        </div>

        <div class="ticket-divider"></div>

        <div class="ticket-info">
          <div class="info-row"><span class="label">Ticket:</span><span class="value">{{ venta.nombre }}</span></div>
          <div class="info-row"><span class="label">Fecha:</span><span class="value">{{ (venta.fecha || venta.createdAt) | date:'dd/MM/yyyy HH:mm' }}</span></div>
          <div class="info-row"><span class="label">Cliente:</span><span class="value">{{ venta.Cliente?.nombres || 'Mostrador' }} {{ venta.Cliente?.apellidos || '' }}</span></div>
        </div>

        <div class="ticket-divider"></div>

        <table class="ticket-items">
          <thead>
            <tr>
              <th class="col-qty">Cant</th>
              <th class="col-desc">Producto</th>
              <th class="col-price">Precio</th>
              <th class="col-subtotal">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of (venta.Detalles || [])">
              <td class="col-qty">{{ d.cantidad }}</td>
              <td class="col-desc">{{ d.ProductoPresentacion?.Producto?.nombre || 'Producto' }} <small>{{ d.ProductoPresentacion?.Presentacion?.nombre || '' }}</small></td>
              <td class="col-price">Q {{ d.precio | number:'.2' }}</td>
              <td class="col-subtotal">Q {{ (d.cantidad * d.precio) | number:'.2' }}</td>
            </tr>
          </tbody>
        </table>

        <div class="ticket-divider"></div>

        <div class="ticket-totals">
          <div class="total-row final">
            <span class="label">TOTAL</span>
            <span class="value">Q {{ (venta.total || 0) | number:'.2' }}</span>
          </div>
          <div class="info-row" *ngIf="venta.Pago">
            <span class="label">Pago:</span>
            <span class="value">{{ venta.Pago.estado || '—' }}</span>
          </div>
        </div>

        <div class="ticket-divider"></div>

        <div class="ticket-footer">
          <p>¡Gracias por su compra!</p>
        </div>
      </div>

      <!-- Print Button -->
      <div class="print-actions no-print">
        <button mat-raised-button color="primary" (click)="imprimir()">
          <mat-icon>print</mat-icon> Imprimir
        </button>
        <button mat-button (click)="cerrar()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .print-wrapper { position: relative; }
    .print-actions { display: flex; gap: 12px; justify-content: center; padding: 20px; background: #fff; border-top: 1px solid #e0e0e0; }

    .ticket {
      width: 80mm;
      margin: 0 auto;
      padding: 16px 12px;
      background: #fff;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
    }

    .ticket-header { text-align: center; margin-bottom: 8px; }
    .ticket-header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .ticket-type { margin: 4px 0 0; font-size: 14px; font-weight: 600; letter-spacing: 2px; }

    .ticket-divider { border-top: 1px dashed #333; margin: 8px 0; }

    .info-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
    .info-row .label { color: #555; }
    .info-row .value { font-weight: 600; text-align: right; }

    .ticket-items { width: 100%; border-collapse: collapse; font-size: 11px; }
    .ticket-items th { text-align: left; border-bottom: 1px solid #333; padding: 4px 2px; font-weight: 700; font-size: 10px; text-transform: uppercase; }
    .ticket-items td { padding: 4px 2px; border-bottom: 1px dotted #ccc; vertical-align: top; }
    .col-qty { width: 12%; text-align: center; }
    .col-desc { width: 40%; }
    .col-price { width: 22%; text-align: right; }
    .col-subtotal { width: 26%; text-align: right; }

    .ticket-totals { }
    .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; margin: 4px 0; }
    .total-row.final { font-size: 18px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6px 0; }

    .ticket-footer { text-align: center; margin-top: 12px; }
    .ticket-footer p { margin: 2px 0; font-size: 12px; font-weight: 600; }

    @media print {
      .no-print { display: none !important; }
      .print-wrapper { position: static; }
      .ticket { width: auto; margin: 0; padding: 0; }
      @page { margin: 0; size: 80mm auto; }
      body { margin: 0; }
    }

    @media screen {
      .ticket { box-shadow: 0 2px 12px rgba(0,0,0,.15); margin: 20px auto; }
    }
  `],
})
export class TicketVentaComponent {
  private readonly dialogRef = inject(MatDialogRef<TicketVentaComponent>);
  readonly venta = inject<Venta>(MAT_DIALOG_DATA);

  imprimir(): void {
    window.print();
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
