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
import { AuthService } from '../../core/services/auth.service';
import { Cliente } from '../../core/interfaces/cliente.interface';
import { Producto } from '../../core/interfaces/producto.interface';

interface PresOption {
  idprodPresenta: number;
  label: string;
  nombre: string;
  presentacion: string;
  precioVenta: number;
}

interface DetalleVenta {
  idprodPresenta: number;
  nombre: string;
  presentacion: string;
  cantidad: number;
  precio: number;
}

@Component({
  selector: 'app-venta-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatTableModule, MatSnackBarModule,
  ],
  templateUrl: './venta-form.component.html',
  styles: [`
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .flex-1 { flex: 1; } .flex-2 { flex: 2; }
    .detalle-row { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
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
  private readonly authService = inject(AuthService);

  clientes: Cliente[] = [];
  readonly productos = signal<Producto[]>([]);

  readonly nextCode = signal<string | null>(null);

  private _selectedPres: PresOption | null = null;
  get selectedPres(): PresOption | null { return this._selectedPres; }
  set selectedPres(val: PresOption | null) {
    this._selectedPres = val;
    if (val) this.newPrecio = val.precioVenta;
  }
  newCantidad = 1;
  newPrecio = 0;

  readonly detalles = signal<DetalleVenta[]>([]);
  readonly detalleColumns = ['producto', 'presentacion', 'cantidad', 'precio', 'subtotal', 'accion'];

  readonly total = computed(() =>
    this.detalles().reduce((sum, d) => sum + d.cantidad * d.precio, 0)
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
    idcliente: [null as number | null],
  });

  ngOnInit(): void {
    this.clienteService.getAllList().subscribe(r => this.clientes = r);
    this.productoService.getAllList().subscribe(r => this.productos.set(r));

    // Obtener el siguiente código de venta
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
      precio: this.newPrecio,
    }]);
    this.selectedPres = null;
    this.newCantidad = 1;
    this.newPrecio = 0;
  }

  removeDetalle(index: number): void {
    this.detalles.update(d => d.filter((_, i) => i !== index));
  }

  submit(): void {
    if (!this.nextCode() || !this.detalles().length) return;

    const session = this.authService.getSession();
    if (!session) {
      this.snackBar.open('No hay sesión activa', 'Cerrar', { duration: 3000 });
      return;
    }

    const v = this.form.getRawValue();
    const totalCalculado = this.total();
    this.service.create({
      nombre: this.nextCode() ?? '',
      idcliente: v.idcliente || undefined,
      idsucursal: session.user.idsucursal ?? undefined,
      idusuario: session.user.id,
      total: totalCalculado,
      detalles: this.detalles().map(d => ({
        idprodPresenta: d.idprodPresenta,
        cantidad: d.cantidad,
        precio: d.precio,
      })),
      pago: { idtipopago: 3, importe: totalCalculado, estado: 'pagado' },
    }).subscribe({
      next: () => { this.snackBar.open('Venta registrada', 'Cerrar', { duration: 2000 }); this.dialogRef.close(true); },
      error: () => this.snackBar.open('Error al registrar venta', 'Cerrar', { duration: 3000 }),
    });
  }
}
