import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
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

const PENDING_COMPRA_KEY = 'pending_compra_form';

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
  templateUrl: './compra-form.component.html',
  styles: [`
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .flex-1 { flex: 1; } .flex-2 { flex: 2; }
    .detalle-row { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .full-table { width: 100%; margin: 8px 0; }
    .total-row { text-align: right; font-size: 18px; margin-top: 16px; padding: 12px; background: var(--mat-sys-surface-container); border-radius: 4px; }
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

  /** Si se cerró con submit (true) o sin submit (falsy) */
  private submitted = false;

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

    // Si cierran sin submit → limpiar
    this.dialogRef.afterClosed().subscribe(() => {
      if (!this.submitted) localStorage.removeItem(PENDING_COMPRA_KEY);
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
      nombre: this.nextCode() ?? '',
      idproveedor: v.idproveedor ?? undefined,
      idsucursal: session.user.idsucursal ?? undefined,
      idusuario: session.user.id,
      detalles: this.detalles().map(d => ({
        idprodPresenta: d.idprodPresenta,
        cantidad: d.cantidad,
        costo: d.costo,
      })),
    }).subscribe({
      next: () => {
        this.submitted = true;
        localStorage.removeItem(PENDING_COMPRA_KEY);
        this.snackBar.open('Compra registrada', 'Cerrar', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: () => this.snackBar.open('Error al registrar compra', 'Cerrar', { duration: 3000 }),
    });
  }

  clearForm(): void {
    this.detalles.set([]);
    this.form.reset({ idproveedor: null });
    localStorage.removeItem(PENDING_COMPRA_KEY);
  }
}
