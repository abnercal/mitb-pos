import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Venta } from '../../core/interfaces/venta.interface';
import { AuthService } from '../../core/services/auth.service';
import { SucursalService } from '../../core/services/sucursal.service';

@Component({
  selector: 'app-ticket-venta',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="print-wrapper">
      <div class="ticket">
        <div class="ticket-header">
          <h1>{{ sucursalName() }}</h1>
          <p class="ticket-type">TICKET DE VENTA</p>
        </div>

        <div class="ticket-divider"></div>

        <div class="ticket-info">
          <div class="info-row">
            <span class="label">Ticket:</span><span class="value">{{ venta.referencia || venta.nombre }}</span>
          </div>
          <div class="info-row">
            <span class="label">Fecha:</span
            ><span class="value">{{
              venta.fecha || venta.createdAt | date: 'dd/MM/yyyy HH:mm'
            }}</span>
          </div>
          <div class="info-row">
            <span class="label">Cliente:</span
            ><span class="value"
              >{{ venta.Cliente?.nombres || 'Consumidor Final' }}
              {{ venta.Cliente?.apellidos || '' }}</span
            >
          </div>
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
            @for (d of venta.Detalles || []; track d) {
              <tr>
                <td class="col-qty">{{ d.cantidad }}</td>
                <td class="col-desc">
                  {{ d.ProductoPresentacion?.Producto?.nombre || 'Producto' }}
                  <small>{{ d.ProductoPresentacion?.Presentacion?.nombre || '' }}</small>
                </td>
                <td class="col-price">Q {{ d.precio | number: '.2' }}</td>
                <td class="col-subtotal">Q {{ d.cantidad * d.precio | number: '.2' }}</td>
              </tr>
            }
          </tbody>
        </table>

        <div class="ticket-divider"></div>

        <div class="ticket-totals">
          <div class="total-row final">
            <span class="label">TOTAL</span>
            <span class="value">Q {{ venta.total || 0 | number: '.2' }}</span>
          </div>
          @if (venta.Pago) {
            <div class="info-row">
              <span class="label">Pago:</span>
              <span class="value">{{ venta.Pago.estado || '—' }}</span>
            </div>
          }
        </div>

        <div class="ticket-divider"></div>

        <div class="ticket-footer">
          <p>¡Gracias por su compra!</p>
        </div>
      </div>

      <div class="print-actions no-print">
        <button mat-raised-button color="primary" (click)="imprimir()">
          <mat-icon>print</mat-icon> Imprimir
        </button>
        <button mat-button (click)="cerrar()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [
    `
      .print-wrapper {
        position: relative;
      }
      .print-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        padding: 20px;
        background: var(--mat-sys-surface);
        border-top: 1px solid var(--mat-sys-outline-variant);
      }

      .ticket {
        width: 80mm;
        margin: 0 auto;
        padding: 0;
        background: #fff;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.4;
        color: #000;
      }

      .ticket > * {
        padding: 0 12px;
      }
      .ticket-header {
        text-align: center;
        padding-top: 8px;
      }
      .ticket-header h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 800;
      }
      .ticket-type {
        margin: 4px 0 0;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 2px;
      }

      .ticket-divider {
        border-top: 1px dashed #333;
        margin: 6px 12px;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        margin: 2px 0;
      }
      .info-row .label {
        color: #555;
      }
      .info-row .value {
        font-weight: 600;
        text-align: right;
      }

      .ticket-items {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      .ticket-items th {
        text-align: left;
        border-bottom: 1px solid #333;
        padding: 4px 2px;
        font-weight: 700;
        font-size: 10px;
        text-transform: uppercase;
      }
      .ticket-items td {
        padding: 4px 2px;
        border-bottom: 1px dotted #ccc;
        vertical-align: top;
      }
      .col-qty {
        width: 12%;
        text-align: center;
      }
      .col-desc {
        width: 40%;
      }
      .col-price {
        width: 22%;
        text-align: right;
      }
      .col-subtotal {
        width: 26%;
        text-align: right;
      }

      .ticket-totals {
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        font-size: 16px;
        font-weight: 800;
        margin: 4px 0;
      }
      .total-row.final {
        font-size: 18px;
        border-top: 2px solid #000;
        border-bottom: 2px solid #000;
        padding: 6px 0;
      }

      .ticket-footer {
        text-align: center;
        margin-top: 8px;
        padding-bottom: 8px;
      }
      .ticket-footer p {
        margin: 2px 0;
        font-size: 12px;
        font-weight: 600;
      }

      @media print {
        .no-print {
          display: none !important;
        }
        .print-wrapper {
          position: static;
        }
        .ticket {
          width: auto;
          margin: 0;
          padding: 0;
        }
        .ticket > * {
          padding: 0;
        }
        .ticket-divider {
          margin: 6px 0;
        }
        .ticket-header {
          padding-top: 2px;
        }

        @page {
          margin: 0;
          size: 80mm auto;
        }

        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          height: auto;
          width: 80mm;
        }

        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }

      @media screen {
        .ticket {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
          margin: 20px auto;
          padding-top: 12px;
        }
      }
    `,
  ],
})
export class TicketVentaComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<TicketVentaComponent>);
  private readonly authService = inject(AuthService);
  private readonly sucursalService = inject(SucursalService);
  readonly venta = inject<Venta>(MAT_DIALOG_DATA);

  readonly sucursalName = signal('MITB POS');

  ngOnInit(): void {
    // Intentar nombre desde la venta (si el backend lo devuelve)
    if (this.venta.Sucursal?.nombre) {
      this.sucursalName.set(this.venta.Sucursal.nombre);
      return;
    }

    // Fallback: cargar desde la sucursal del usuario logueado
    const session = this.authService.getSession();
    const idSucursal = session?.user?.idsucursal;
    if (idSucursal) {
      this.sucursalService.getById(idSucursal).subscribe({
        next: (s) => this.sucursalName.set(s.nombre),
      });
    }
  }

  imprimir(): void {
    window.print();
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
