import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { VentaService } from '../../core/services/venta.service';
import { ClienteService } from '../../core/services/cliente.service';
import { ProductoService } from '../../core/services/producto.service';
import { AuthService } from '../../core/services/auth.service';
import { PrecioService } from '../../core/services/precio.service';
import { Cliente } from '../../core/interfaces/cliente.interface';
import { Producto } from '../../core/interfaces/producto.interface';

const PENDING_VENTA_KEY = 'pending_venta_form';

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
    MatTableModule, MatCheckboxModule, MatSnackBarModule, MatTabsModule,
  ],
  templateUrl: './venta-form.component.html',
  styles: [`
    .tab-content { padding: 20px 4px 4px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .flex-1 { flex: 1; } .flex-2 { flex: 2; }
    .detalle-row { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .full-table { width: 100%; margin: 8px 0; }
    .total-row { text-align: right; font-size: 18px; margin-top: 16px; padding: 12px; background: var(--mat-sys-surface-container); border-radius: 4px; }
    .empty-detalle { text-align: center; padding: 20px; color: var(--mat-sys-on-surface-variant); }
    .cotizacion-row { margin: 4px 0 20px; }
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
  private readonly precioService = inject(PrecioService);

  /** Si se cerró con submit (true) o sin submit (falsy) */
  private submitted = false;

  clientes: Cliente[] = [];
  readonly productos = signal<Producto[]>([]);

  readonly nextCode = signal<string | null>(null);
  nombreCliente = '';
  /** Si se marca, la venta se crea como Cotización (no descuenta inventario ni crea Pago). */
  esCotizacion = false;

  get isCFSelected(): boolean {
    const idcliente = this.form.get('idcliente')?.value;
    if (idcliente == null) return false;
    const c = this.clientes.find(cl => cl._id === idcliente);
    return c?.nit === 'CF';
  }

  private _selectedPres: PresOption | null = null;
  get selectedPres(): PresOption | null { return this._selectedPres; }
  set selectedPres(val: PresOption | null) {
    this._selectedPres = val;
    this.resolvePrecio();
  }
  newCantidad = 1;
  /** Precio resuelto por el servidor (solo lectura) — el backend ignora cualquier precio enviado. */
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

  constructor() {
    effect(() => {
      // Auto-guardar detalles cuando cambian
      const d = this.detalles();
      if (d.length) {
        localStorage.setItem(PENDING_VENTA_KEY, JSON.stringify({
          detalles: d,
          idcliente: this.form.get('idcliente')?.value ?? null,
          nombreCliente: this.nombreCliente,
        }));
      } else {
        localStorage.removeItem(PENDING_VENTA_KEY);
      }
    });
  }

  ngOnInit(): void {
    this.clienteService.getAllList().subscribe(r => this.clientes = r);
    this.productoService.getAllList().subscribe(r => this.productos.set(r));

    // Obtener el siguiente código de venta
    this.service.getNextCode().subscribe({
      next: (r) => this.nextCode.set(r.codigo),
      error: () => this.nextCode.set('Error al generar código'),
    });

    // Restaurar formulario pendiente
    const raw = localStorage.getItem(PENDING_VENTA_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved.detalles?.length) {
          this.detalles.set(saved.detalles);
          if (saved.idcliente != null) this.form.patchValue({ idcliente: saved.idcliente });
          this.snackBar.open(
            `Formulario recuperado — ${saved.detalles.length} detalle${saved.detalles.length !== 1 ? 's' : ''}`,
            'Cerrar', { duration: 4000 },
          );
        }
      } catch { localStorage.removeItem(PENDING_VENTA_KEY); }
    }

    // Si cierran sin submit → limpiar
    this.dialogRef.afterClosed().subscribe(() => {
      if (!this.submitted) localStorage.removeItem(PENDING_VENTA_KEY);
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
      referencia: this.nextCode() ?? undefined,
      nombre: this.nombreCliente || undefined,
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
      esCotizacion: this.esCotizacion,
    }).subscribe({
      next: () => {
        this.submitted = true;
        localStorage.removeItem(PENDING_VENTA_KEY);
        this.snackBar.open(
          this.esCotizacion ? 'Cotización registrada' : 'Venta registrada',
          'Cerrar', { duration: 2000 },
        );
        this.dialogRef.close(true);
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Error al registrar venta', 'Cerrar', { duration: 5000 }),
    });
  }

  onClienteChange(idcliente: number | null): void {
    if (idcliente == null) {
      this.nombreCliente = '';
    } else {
      const c = this.clientes.find(cl => cl._id === idcliente);
      this.nombreCliente = [c?.nombres, c?.apellidos].filter(Boolean).join(' ');
    }
    // Si ya hay una presentación elegida, el precio depende del cliente — se re-resuelve.
    this.resolvePrecio();
  }

  /** idtipoCli del Cliente elegido en el formulario (o undefined si no hay cliente elegido). */
  private resolveIdTipoCli(): number | undefined {
    const idcliente = this.form.get('idcliente')?.value;
    if (idcliente == null) return undefined;
    const c = this.clientes.find(cl => cl._id === idcliente);
    return c?.idtipoCli ?? undefined;
  }

  /**
   * Resuelve `newPrecio` vía PrecioService.getByPresentacion — mismo patrón que
   * pos.component.ts. El campo es de solo lectura: el backend ignora el `precio`
   * enviado y siempre cobra el que él mismo resuelve.
   */
  private resolvePrecio(): void {
    const pres = this._selectedPres;
    if (!pres) {
      this.newPrecio = 0;
      return;
    }
    const idtipoCli = this.resolveIdTipoCli();
    if (idtipoCli == null) {
      this.newPrecio = pres.precioVenta;
      return;
    }
    this.precioService.getByPresentacion(pres.idprodPresenta, idtipoCli).subscribe({
      next: (res) => { this.newPrecio = Number(res.precio); },
      error: () => { this.newPrecio = pres.precioVenta; },
    });
  }

  clearForm(): void {
    this.detalles.set([]);
    this.form.reset({ idcliente: null });
    this.nombreCliente = '';
    this.esCotizacion = false;
    localStorage.removeItem(PENDING_VENTA_KEY);
  }
}
