import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompraService } from '../../core/services/compra.service';
import { ProveedorService } from '../../core/services/proveedor.service';
import { ProductoService } from '../../core/services/producto.service';
import { AuthService } from '../../core/services/auth.service';
import { Proveedor } from '../../core/interfaces/proveedor.interface';
import { Producto } from '../../core/interfaces/producto.interface';

const PENDING_COMPRA_KEY = 'pending_compra_form';

interface PresOption {
  idprodPresenta: number;
  label: string;
  nombre: string;
  presentacion: string;
  precioVenta: number;
  /** Producto.controla_vencimiento del producto dueño de esta presentación. */
  controlaVencimiento: boolean;
}

interface DetalleCompra {
  idprodPresenta: number;
  nombre: string;
  presentacion: string;
  cantidad: number;
  costo: number;
  controlaVencimiento: boolean;
  /** Requerida cuando controlaVencimiento es true (ver FECHA_VENCIMIENTO_REQUERIDA en el backend). */
  fechaVencimiento: string | null;
}

@Component({
  selector: 'app-compra-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatTableModule, MatSnackBarModule, MatDatepickerModule, MatNativeDateModule,
    MatTooltipModule,
  ],
  templateUrl: './compra-form.component.html',
  styles: [`
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .form-section { padding: 4px; }
    .section-title { font-size: 15px; font-weight: 600; margin: 0 0 12px; color: var(--mat-sys-on-surface-variant); }
    .form-row { display: flex; gap: 16px; margin-bottom: 8px; flex-wrap: wrap; }
    .flex-1 { flex: 1; } .flex-2 { flex: 2; }
    .detalle-row { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .full-table { width: 100%; margin: 8px 0; }
    .total-row { text-align: right; font-size: 18px; margin-top: 16px; padding: 12px; background: var(--mat-sys-surface-container); border-radius: 4px; }
    .empty-detalle { text-align: center; padding: 20px; color: var(--mat-sys-on-surface-variant); }
    .form-error { color: var(--mat-sys-error); font-size: 13px; margin: -8px 0 16px; }
    .section-divider { border: none; border-top: 1px solid var(--mat-sys-outline-variant); margin: 24px 0; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }
  `],
})
export default class CompraFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CompraService);
  private readonly proveedorService = inject(ProveedorService);
  private readonly productoService = inject(ProductoService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);

  proveedores: Proveedor[] = [];
  readonly productos = signal<Producto[]>([]);

  readonly nextCode = signal<string | null>(null);

  selectedPres: PresOption | null = null;
  newCantidad = 1;
  newCosto = 0;
  /** Fecha de vencimiento del lote a crear — solo aplica cuando selectedPres.controlaVencimiento es true. */
  newFechaVencimiento: string | null = null;
  /** Error de validación local mostrado si intentan agregar sin fecha de vencimiento requerida. */
  readonly detalleError = signal<string | null>(null);
  /** Error de nivel de formulario — fallback defensivo si el backend igual responde 400 FECHA_VENCIMIENTO_REQUERIDA. */
  readonly formError = signal<string | null>(null);

  readonly detalles = signal<DetalleCompra[]>([]);
  readonly detalleColumns = ['producto', 'presentacion', 'cantidad', 'costo', 'vencimiento', 'subtotal', 'accion'];

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
          controlaVencimiento: !!p.controla_vencimiento,
        }))
    )
  );

  readonly form = this.fb.group({
    idproveedor: [null as number | null, Validators.required],
    fecha_limite_pago: [null as string | null],
  });

  constructor() {
    effect(() => {
      const d = this.detalles();
      if (d.length) {
        localStorage.setItem(PENDING_COMPRA_KEY, JSON.stringify({
          detalles: d,
          idproveedor: this.form.get('idproveedor')?.value ?? null,
        }));
      } else {
        localStorage.removeItem(PENDING_COMPRA_KEY);
      }
    });
  }

  ngOnInit(): void {
    this.proveedorService.getAllList().subscribe(r => this.proveedores = r);
    this.productoService.getAllList().subscribe(r => this.productos.set(r));

    // Obtener el siguiente código de compra
    this.service.getNextCode().subscribe({
      next: (r) => this.nextCode.set(r.codigo),
      error: () => this.nextCode.set('Error al generar código'),
    });

    // Restaurar formulario pendiente
    const raw = localStorage.getItem(PENDING_COMPRA_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved.detalles?.length) {
          this.detalles.set(saved.detalles);
          if (saved.idproveedor != null) this.form.patchValue({ idproveedor: saved.idproveedor });
          this.snackBar.open(
            `Formulario recuperado — ${saved.detalles.length} detalle${saved.detalles.length !== 1 ? 's' : ''}`,
            'Cerrar', { duration: 4000 },
          );
        }
      } catch { localStorage.removeItem(PENDING_COMPRA_KEY); }
    }
  }

  addDetalle(): void {
    if (!this.selectedPres || !this.newCantidad) return;
    if (this.selectedPres.controlaVencimiento && !this.newFechaVencimiento) {
      this.detalleError.set('Este producto controla vencimiento — la fecha de vencimiento es requerida.');
      return;
    }
    this.detalleError.set(null);
    this.detalles.update(d => [...d, {
      idprodPresenta: this.selectedPres!.idprodPresenta,
      nombre: this.selectedPres!.nombre,
      presentacion: this.selectedPres!.presentacion,
      cantidad: this.newCantidad,
      costo: this.newCosto,
      controlaVencimiento: this.selectedPres!.controlaVencimiento,
      fechaVencimiento: this.selectedPres!.controlaVencimiento ? this.newFechaVencimiento : null,
    }]);
    this.selectedPres = null;
    this.newCantidad = 1;
    this.newCosto = 0;
    this.newFechaVencimiento = null;
  }

  removeDetalle(index: number): void {
    this.detalles.update(d => d.filter((_, i) => i !== index));
  }

  submit(): void {
    this.formError.set(null);
    if (!this.nextCode() || this.form.invalid || !this.detalles().length) return;

    // Validación defensiva: no debería poder pasar por acá dado que addDetalle ya lo exige,
    // pero se revalida antes de enviar por si el estado local quedó inconsistente.
    const faltante = this.detalles().find(d => d.controlaVencimiento && !d.fechaVencimiento);
    if (faltante) {
      this.formError.set(`Falta la fecha de vencimiento para "${faltante.nombre} — ${faltante.presentacion}".`);
      return;
    }

    const session = this.authService.getSession();
    if (!session) {
      this.snackBar.open('No hay sesión activa', 'Cerrar', { duration: 3000 });
      return;
    }

    const v = this.form.getRawValue();
    this.service.create({
      nombre: this.nextCode() ?? '',
      idproveedor: v.idproveedor ?? undefined,
      idsucursal: session.user.idsucursal ?? undefined,
      idusuario: session.user.id,
      fecha_limite_pago: v.fecha_limite_pago || null,
      detalles: this.detalles().map(d => ({
        idprodPresenta: d.idprodPresenta,
        cantidad: d.cantidad,
        costo: d.costo,
        ...(d.controlaVencimiento ? { fecha_vencimiento: d.fechaVencimiento } : {}),
      })),
    }).subscribe({
      next: () => {
        localStorage.removeItem(PENDING_COMPRA_KEY);
        this.snackBar.open('Compra registrada', 'Cerrar', { duration: 2000 });
        this.router.navigate(['/compras']);
      },
      error: (err) => {
        if (err?.error?.code === 'FECHA_VENCIMIENTO_REQUERIDA') {
          this.formError.set('El servidor rechazó la compra: falta fecha de vencimiento en al menos un detalle.');
          return;
        }
        this.snackBar.open(err?.error?.message || 'Error al registrar compra', 'Cerrar', { duration: 3000 });
      },
    });
  }

  clearForm(): void {
    this.detalles.set([]);
    this.form.reset({ idproveedor: null, fecha_limite_pago: null });
    this.formError.set(null);
    this.detalleError.set(null);
    localStorage.removeItem(PENDING_COMPRA_KEY);
  }

  goBack(): void {
    this.router.navigate(['/compras']);
  }
}
