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
import { CompraService } from '../../core/services/compra.service';
import { ProveedorService } from '../../core/services/proveedor.service';
import { ProductoService } from '../../core/services/producto.service';
import { AuthService } from '../../core/services/auth.service';
import { Proveedor } from '../../core/interfaces/proveedor.interface';
import { Producto } from '../../core/interfaces/producto.interface';

interface PresOption {
  idprodPresenta: number;
  label: string;
  nombre: string;
  presentacion: string;
  precioVenta: number;
}

interface DetalleCompra {
  idprodPresenta: number;
  nombre: string;
  presentacion: string;
  cantidad: number;
  costo: number;
}

@Component({
  selector: 'app-compra-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatTableModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Nueva compra</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <div class="form-row">
          <mat-form-field appearance="fill" class="flex-2">
            <mat-label>Referencia</mat-label>
            <input matInput [value]="nextCode()" disabled placeholder="Generando...">
          </mat-form-field>

          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Proveedor *</mat-label>
            <mat-select formControlName="idproveedor">
              <mat-option *ngFor="let p of proveedores" [value]="p._id">{{ p.nombre }}</mat-option>
            </mat-select>
            <mat-error>Requerido</mat-error>
          </mat-form-field>
        </div>

        <h3>Detalle de productos</h3>
        <div class="detalle-row">
          <mat-form-field appearance="fill" class="flex-2">
            <mat-label>Producto — Presentación</mat-label>
            <mat-select [(value)]="selectedPres">
              <mat-option *ngFor="let opt of presOptions()" [value]="opt">
                {{ opt.label }}
              </mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Cantidad</mat-label>
            <input matInput type="number" [(ngModel)]="newCantidad" [ngModelOptions]="{standalone: true}" min="1">
          </mat-form-field>
          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Costo</mat-label>
            <input matInput type="number" step="0.01" [(ngModel)]="newCosto" [ngModelOptions]="{standalone: true}" min="0">
          </mat-form-field>
          <button mat-icon-button color="primary" (click)="addDetalle()" [disabled]="!selectedPres || !newCantidad">
            <mat-icon>add_circle</mat-icon>
          </button>
        </div>

        <table mat-table [dataSource]="detalles()" class="full-table">
          <ng-container matColumnDef="producto">
            <th mat-header-cell *matHeaderCellDef>Producto</th>
            <td mat-cell *matCellDef="let item; let i = index">{{ item.nombre }}</td>
          </ng-container>
          <ng-container matColumnDef="presentacion">
            <th mat-header-cell *matHeaderCellDef>Presentación</th>
            <td mat-cell *matCellDef="let item">{{ item.presentacion }}</td>
          </ng-container>
          <ng-container matColumnDef="cantidad">
            <th mat-header-cell *matHeaderCellDef>Cant.</th>
            <td mat-cell *matCellDef="let item">{{ item.cantidad }}</td>
          </ng-container>
          <ng-container matColumnDef="costo">
            <th mat-header-cell *matHeaderCellDef>Costo</th>
            <td mat-cell *matCellDef="let item">Q {{ item.costo | number:'.2' }}</td>
          </ng-container>
          <ng-container matColumnDef="subtotal">
            <th mat-header-cell *matHeaderCellDef>Subtotal</th>
            <td mat-cell *matCellDef="let item">Q {{ (item.cantidad * item.costo) | number:'.2' }}</td>
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
              <p class="empty-detalle">Agregá productos a la compra</p>
            </td>
          </tr>
        </table>

        <div class="total-row">
          <strong>Total: Q {{ total() | number:'.2' }}</strong>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="!nextCode() || form.invalid || !detalles().length">
          Registrar compra
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .flex-1 { flex: 1; } .flex-2 { flex: 2; }
    .detalle-row { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .full-table { width: 100%; margin: 8px 0; }
    .total-row { text-align: right; font-size: 18px; margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 4px; }
    .empty-detalle { text-align: center; padding: 20px; color: #999; }
  `],
})
export class CompraFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CompraService);
  private readonly proveedorService = inject(ProveedorService);
  private readonly productoService = inject(ProductoService);
  private readonly dialogRef = inject(MatDialogRef<CompraFormComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);

  proveedores: Proveedor[] = [];
  readonly productos = signal<Producto[]>([]);

  readonly nextCode = signal<string | null>(null);

  selectedPres: PresOption | null = null;
  newCantidad = 1;
  newCosto = 0;

  readonly detalles = signal<DetalleCompra[]>([]);
  readonly detalleColumns = ['producto', 'presentacion', 'cantidad', 'costo', 'subtotal', 'accion'];

  readonly total = computed(() =>
    this.detalles().reduce((sum, d) => sum + d.cantidad * d.costo, 0)
  );

  readonly presOptions = computed<PresOption[]>(() =>
    this.productos().flatMap(p =>
      (p.Presentaciones || [])
        .filter(pp => pp.estado !== 0)
        .map(pp => ({
          idprodPresenta: pp.idprodPresenta!,
          label: `${p.nombre} — ${pp.Presentacion?.nombre || 'Sin nombre'} (Q ${Number(pp.precio_venta || 0).toFixed(2)})`,
          nombre: p.nombre,
          presentacion: pp.Presentacion?.nombre || '',
          precioVenta: Number(pp.precio_venta || 0),
        }))
    )
  );

  readonly form = this.fb.group({
    idproveedor: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.proveedorService.getAllList().subscribe(r => this.proveedores = r);
    this.productoService.getAllList().subscribe(r => this.productos.set(r));

    // Obtener el siguiente código de compra
    this.service.getNextCode().subscribe({
      next: (r) => this.nextCode.set(r.codigo),
      error: () => this.nextCode.set('Error al generar código'),
    });
  }

  addDetalle(): void {
    if (!this.selectedPres || !this.newCantidad) return;
    this.detalles.update(d => [...d, {
      idprodPresenta: this.selectedPres!.idprodPresenta,
      nombre: this.selectedPres!.nombre,
      presentacion: this.selectedPres!.presentacion,
      cantidad: this.newCantidad,
      costo: this.newCosto,
    }]);
    this.selectedPres = null;
    this.newCantidad = 1;
    this.newCosto = 0;
  }

  removeDetalle(index: number): void {
    this.detalles.update(d => d.filter((_, i) => i !== index));
  }

  submit(): void {
    if (!this.nextCode() || this.form.invalid || !this.detalles().length) return;

    const session = this.authService.getSession();
    if (!session) {
      this.snackBar.open('No hay sesión activa', 'Cerrar', { duration: 3000 });
      return;
    }

    const v = this.form.getRawValue();
    this.service.create({
      nombre: this.nextCode(),
      idproveedor: v.idproveedor,
      idsucursal: session.user.idsucursal,
      idusuario: session.user.id,
      detalles: this.detalles().map(d => ({
        idprodPresenta: d.idprodPresenta,
        cantidad: d.cantidad,
        costo: d.costo,
      })),
    }).subscribe({
      next: () => { this.snackBar.open('Compra registrada', 'Cerrar', { duration: 2000 }); this.dialogRef.close(true); },
      error: () => this.snackBar.open('Error al registrar compra', 'Cerrar', { duration: 3000 }),
    });
  }
}
