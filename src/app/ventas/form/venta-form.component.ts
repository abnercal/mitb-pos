import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { VentaService } from '../../core/services/venta.service';
import { ClienteService } from '../../core/services/cliente.service';
import { ProductoService } from '../../core/services/producto.service';
import { Cliente } from '../../core/interfaces/cliente.interface';
import { Producto } from '../../core/interfaces/producto.interface';

@Component({
  selector: 'app-venta-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatTableModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Nueva venta</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <div class="form-row">
          <mat-form-field appearance="fill" class="flex-2">
            <mat-label>Referencia *</mat-label>
            <input matInput formControlName="nombre" placeholder="Ej: POS-001" autocomplete="off">
            <mat-error>Requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Cliente</mat-label>
            <mat-select formControlName="idcliente">
              <mat-option [value]="null">Mostrador (sin cliente)</mat-option>
              <mat-option *ngFor="let c of clientes" [value]="c._id">{{ c.nombres }} {{ c.apellidos }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <h3>Detalle de productos</h3>
        <div class="detalle-row">
          <mat-form-field appearance="fill" class="flex-2">
            <mat-label>Producto</mat-label>
            <mat-select [(value)]="selectedProducto">
              <mat-option *ngFor="let p of productos" [value]="p">{{ p.nombre }} ({{ p.codigoprod }})</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Cantidad</mat-label>
            <input matInput type="number" [(ngModel)]="newCantidad" [ngModelOptions]="{standalone: true}" min="1">
          </mat-form-field>
          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Precio Q</mat-label>
            <input matInput type="number" step="0.01" [(ngModel)]="newPrecio" [ngModelOptions]="{standalone: true}" min="0">
          </mat-form-field>
          <button mat-icon-button color="primary" (click)="addDetalle()" [disabled]="!selectedProducto || !newCantidad">
            <mat-icon>add_circle</mat-icon>
          </button>
        </div>

        <table mat-table [dataSource]="detalles()" class="full-table">
          <ng-container matColumnDef="producto">
            <th mat-header-cell *matHeaderCellDef>Producto</th>
            <td mat-cell *matCellDef="let item">{{ item.nombre }}</td>
          </ng-container>
          <ng-container matColumnDef="cantidad">
            <th mat-header-cell *matHeaderCellDef>Cant.</th>
            <td mat-cell *matCellDef="let item">{{ item.cantidad }}</td>
          </ng-container>
          <ng-container matColumnDef="precio">
            <th mat-header-cell *matHeaderCellDef>Precio</th>
            <td mat-cell *matCellDef="let item">Q {{ item.precio | number:'.2' }}</td>
          </ng-container>
          <ng-container matColumnDef="subtotal">
            <th mat-header-cell *matHeaderCellDef>Subtotal</th>
            <td mat-cell *matCellDef="let item">Q {{ (item.cantidad * item.precio) | number:'.2' }}</td>
          </ng-container>
          <ng-container matColumnDef="accion">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let item; let i = index">
              <button mat-icon-button color="warn" (click)="removeDetalle(i)" size="small"><mat-icon>remove_circle</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="detalleColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: detalleColumns"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell" [attr.colspan]="detalleColumns.length">
              <p class="empty-detalle">Agregá productos a la venta</p>
            </td>
          </tr>
        </table>

        <div class="total-row">
          <strong>Total: Q {{ total() | number:'.2' }}</strong>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || !detalles().length">
          Registrar venta
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .flex-1 { flex: 1; } .flex-2 { flex: 2; }
    .detalle-row { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
    .full-table { width: 100%; margin: 8px 0; }
    .total-row { text-align: right; font-size: 18px; margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 4px; }
    .empty-detalle { text-align: center; padding: 20px; color: #999; }
  `],
})
export class VentaFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly productoService = inject(ProductoService);
  private readonly dialogRef = inject(MatDialogRef<VentaFormComponent>);
  private readonly snackBar = inject(MatSnackBar);

  clientes: Cliente[] = [];
  productos: Producto[] = [];

  selectedProducto: Producto | null = null;
  newCantidad = 1;
  newPrecio = 0;

  readonly detalles = signal<{ codigoprod: number; nombre: string; cantidad: number; precio: number }[]>([]);
  readonly detalleColumns = ['producto', 'cantidad', 'precio', 'subtotal', 'accion'];

  readonly total = computed(() =>
    this.detalles().reduce((sum, d) => sum + d.cantidad * d.precio, 0)
  );

  readonly form = this.fb.group({
    nombre: ['', Validators.required],
    idcliente: [null as number | null],
  });

  ngOnInit(): void {
    this.clienteService.getAll().subscribe(r => this.clientes = r);
    this.productoService.getAll().subscribe(r => this.productos = r);
  }

  addDetalle(): void {
    if (!this.selectedProducto || !this.newCantidad) return;
    this.detalles.update(d => [...d, {
      codigoprod: this.selectedProducto!.codigoprod!,
      nombre: this.selectedProducto!.nombre,
      cantidad: this.newCantidad,
      precio: this.newPrecio,
    }]);
    this.selectedProducto = null;
    this.newCantidad = 1;
    this.newPrecio = 0;
  }

  removeDetalle(index: number): void {
    this.detalles.update(d => d.filter((_, i) => i !== index));
  }

  submit(): void {
    if (this.form.invalid || !this.detalles().length) return;
    const v = this.form.getRawValue();
    const totalCalculado = this.total();
    const payload = {
      nombre: v.nombre,
      idcliente: v.idcliente || undefined,
      idsucursal: 1,
      idusuario: 1,
      total_orden: totalCalculado,
      detalles: this.detalles().map(d => ({
        codigoprod: d.codigoprod,
        cantidad: d.cantidad,
        precio: d.precio,
      })),
      pago: { idtipopago: 1, importe: totalCalculado, estado: 'pagado' },
    };
    this.service.create(payload).subscribe({
      next: () => { this.snackBar.open('Venta registrada', 'Cerrar', { duration: 2000 }); this.dialogRef.close(true); },
      error: () => this.snackBar.open('Error al registrar venta', 'Cerrar', { duration: 3000 }),
    });
  }
}
