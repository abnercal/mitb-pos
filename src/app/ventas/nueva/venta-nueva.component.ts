import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductoService } from '../../core/services/producto.service';
import { ClienteService } from '../../core/services/cliente.service';
import { VentaService } from '../../core/services/venta.service';
import { AuthService } from '../../core/services/auth.service';
import { PrecioService } from '../../core/services/precio.service';
import { TipoClienteService } from '../../core/services/tipo-cliente.service';
import { Producto } from '../../core/interfaces/producto.interface';
import { ProductoPresentacion } from '../../core/interfaces/producto-presentacion.interface';
import { Cliente, TipoClie } from '../../core/interfaces/cliente.interface';
import { Precio } from '../../core/interfaces/precio.interface';
import { Venta } from '../../core/interfaces/venta.interface';
import { TicketVentaComponent } from '../../shared/components/ticket-venta.component';
import { VentaNuevaPresDialog } from './pres-dialog';

interface DetalleVenta {
  idprodPresenta: number;
  nombre: string;
  presentacion: string;
  cantidad: number;
  precio: number;
}

interface PendingVentaNueva {
  detalles: DetalleVenta[];
  idcliente: number | null;
  nombreCliente: string;
  idTipoVenta: number | null;
  esCotizacion: boolean;
}

const PENDING_KEY = 'pending_venta_nueva';

/**
 * Pantalla completa para registrar una venta o cotización — reemplaza el
 * modal angosto de dos viñetas que había antes. Deliberadamente separada de
 * /pos (mismo espíritu de catálogo + "Tipo de venta" resolviendo precios,
 * pero con Referencia visible y soporte de Cotización, que el POS no maneja).
 */
@Component({
  selector: 'app-venta-nueva',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './venta-nueva.component.html',
  styleUrl: './venta-nueva.component.scss',
})
export default class VentaNuevaComponent implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly clienteService = inject(ClienteService);
  private readonly ventaService = inject(VentaService);
  private readonly authService = inject(AuthService);
  private readonly precioService = inject(PrecioService);
  private readonly tipoClienteService = inject(TipoClienteService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly productsError = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly allProducts = signal<Producto[]>([]);
  readonly allPrecios = signal<Precio[]>([]);
  readonly nextCode = signal<string | null>(null);

  clientes: Cliente[] = [];
  tiposCliente: TipoClie[] = [];

  selectedClienteId: number | null = null;
  /** Tipo de cliente usado para resolver TODOS los precios listados — independiente del Cliente elegido. */
  selectedTipoVentaId: number | null = null;
  /** Nombre libre para la venta — solo si el cajero lo escribe. Vacío = sin override, prevalece el Cliente real resuelto por el servidor (Consumidor Final). */
  nombreCliente = '';
  /** Si se marca, la venta se crea como Cotización (no descuenta inventario ni crea Pago). */
  esCotizacion = false;

  readonly detalles = signal<DetalleVenta[]>([]);

  get isCFSelected(): boolean {
    if (this.selectedClienteId == null) return false;
    const c = this.clientes.find((cl) => cl._id === this.selectedClienteId);
    return c?.nit === 'CF';
  }

  readonly total = computed(() =>
    this.detalles().reduce((sum, d) => sum + d.cantidad * d.precio, 0),
  );

  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.allProducts();
    return this.allProducts().filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        String(p.codigoprod).includes(term) ||
        (p.Marca?.nombre && p.Marca.nombre.toLowerCase().includes(term)) ||
        p.Presentaciones?.some((pp) => pp.codigo_barras?.toLowerCase().includes(term)),
    );
  });

  /** idprodPresenta:idtipoCli -> precio, para resolver el catálogo sin ida y vuelta al servidor. */
  private readonly preciosPorTipo = computed(() => {
    const map = new Map<string, number>();
    for (const p of this.allPrecios()) {
      if (p.idprodPresenta != null && p.idtipoCli != null) {
        map.set(`${p.idprodPresenta}:${p.idtipoCli}`, Number(p.precio));
      }
    }
    return map;
  });

  ngOnInit(): void {
    this.loadProducts();
    this.clienteService.getAllList().subscribe((r) => (this.clientes = r));
    this.tipoClienteService.getAll().subscribe((r) => (this.tiposCliente = r));
    // Todos los precios especiales de una sola vez — así el catálogo entero
    // se re-precia al instante al cambiar "Tipo de venta", sin pedir uno por uno.
    this.precioService.getAllList().subscribe((r) => this.allPrecios.set(r));

    this.ventaService.getNextCode().subscribe({
      next: (r) => this.nextCode.set(r.codigo),
      error: () => this.nextCode.set('Error al generar código'),
    });

    this.loadPending();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productsError.set(null);
    this.productoService.getAllList().subscribe({
      next: (r) => {
        this.allProducts.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.productsError.set('No se pudieron cargar los productos');
        this.loading.set(false);
      },
    });
  }

  /** Precio de una presentación según el "Tipo de venta" elegido, con precio_venta como fallback. */
  precioResuelto(pp: ProductoPresentacion): number {
    const tipo = this.selectedTipoVentaId;
    const base = Number(pp.precio_venta) || 0;
    if (tipo == null) return base;
    return this.preciosPorTipo().get(`${pp.idprodPresenta}:${tipo}`) ?? base;
  }

  private findPresentacion(idprodPresenta: number): ProductoPresentacion | undefined {
    for (const p of this.allProducts()) {
      const pp = p.Presentaciones?.find((x) => x.idprodPresenta === idprodPresenta);
      if (pp) return pp;
    }
    return undefined;
  }

  onClienteChange(idcliente: number | null): void {
    this.selectedClienteId = idcliente;
    if (idcliente == null) {
      // Sin cliente elegido: no se manda `nombre` — el backend resuelve solo
      // contra el Cliente real "Consumidor Final" (nit CF).
      this.nombreCliente = '';
      this.selectedTipoVentaId = null;
    } else {
      const c = this.clientes.find((cl) => cl._id === idcliente);
      this.nombreCliente = [c?.nombres, c?.apellidos].filter(Boolean).join(' ');
      // Solo un valor por defecto — queda editable después sin volver a sincronizarse.
      this.selectedTipoVentaId = c?.idtipoCli ?? null;
    }
    this.onTipoVentaChange();
  }

  /** Re-precia el detalle ya cargado cuando cambia el "Tipo de venta". */
  onTipoVentaChange(): void {
    this.detalles.update((items) =>
      items.map((d) => {
        const pp = this.findPresentacion(d.idprodPresenta);
        return pp ? { ...d, precio: this.precioResuelto(pp) } : d;
      }),
    );
  }

  selectProduct(p: Producto): void {
    const pres = (p.Presentaciones || []).filter((pp) => pp.estado !== 0);

    if (pres.length === 0) {
      this.snackBar.open('Este producto no tiene presentaciones activas', 'Cerrar', {
        duration: 2000,
      });
      return;
    }

    if (pres.length === 1) {
      this.addDetalle(p, pres[0]);
      return;
    }

    const ref = this.dialog.open(VentaNuevaPresDialog, {
      width: '420px',
      data: {
        producto: p,
        presentaciones: pres,
        resolvePrecio: (pp: ProductoPresentacion) => this.precioResuelto(pp),
      },
    });
    ref.afterClosed().subscribe((selected: ProductoPresentacion | null) => {
      if (selected) this.addDetalle(p, selected);
    });
  }

  private addDetalle(p: Producto, pp: ProductoPresentacion): void {
    const existing = this.detalles().find((d) => d.idprodPresenta === pp.idprodPresenta);
    if (existing) {
      this.updateCantidad(
        this.detalles().findIndex((d) => d.idprodPresenta === pp.idprodPresenta),
        existing.cantidad + 1,
      );
      return;
    }
    this.detalles.update((items) => [
      ...items,
      {
        idprodPresenta: pp.idprodPresenta!,
        nombre: p.nombre,
        presentacion: pp.Presentacion?.nombre || '',
        cantidad: 1,
        precio: this.precioResuelto(pp),
      },
    ]);
    this.savePending();
  }

  updateCantidad(index: number, cantidad: number): void {
    if (cantidad <= 0) {
      this.removeDetalle(index);
      return;
    }
    this.detalles.update((items) =>
      items.map((d, i) => (i === index ? { ...d, cantidad } : d)),
    );
    this.savePending();
  }

  removeDetalle(index: number): void {
    this.detalles.update((items) => items.filter((_, i) => i !== index));
    this.savePending();
  }

  private savePending(): void {
    const items = this.detalles();
    if (!items.length) {
      localStorage.removeItem(PENDING_KEY);
      return;
    }
    const data: PendingVentaNueva = {
      detalles: items,
      idcliente: this.selectedClienteId,
      nombreCliente: this.nombreCliente,
      idTipoVenta: this.selectedTipoVentaId,
      esCotizacion: this.esCotizacion,
    };
    localStorage.setItem(PENDING_KEY, JSON.stringify(data));
  }

  private loadPending(): void {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    try {
      const data: PendingVentaNueva = JSON.parse(raw);
      if (!data.detalles?.length) return;
      this.detalles.set(data.detalles);
      this.selectedClienteId = data.idcliente ?? null;
      this.nombreCliente = data.nombreCliente ?? '';
      this.selectedTipoVentaId = data.idTipoVenta ?? null;
      this.esCotizacion = data.esCotizacion ?? false;
      this.snackBar.open(
        `Venta recuperada — ${data.detalles.length} producto${data.detalles.length !== 1 ? 's' : ''}`,
        'Cerrar',
        { duration: 4000 },
      );
    } catch {
      localStorage.removeItem(PENDING_KEY);
    }
  }

  clearForm(): void {
    this.detalles.set([]);
    this.selectedClienteId = null;
    this.selectedTipoVentaId = null;
    this.nombreCliente = '';
    this.esCotizacion = false;
    localStorage.removeItem(PENDING_KEY);
  }

  goBack(): void {
    this.router.navigate(['/ventas']);
  }

  submit(): void {
    if (!this.detalles().length) return;

    const session = this.authService.getSession();
    if (!session) {
      this.snackBar.open('No hay sesión activa', 'Cerrar', { duration: 3000 });
      return;
    }

    const total = this.total();
    this.ventaService
      .create({
        referencia: this.nextCode() ?? undefined,
        // Solo se manda si se escribió un nombre puntual — vacío = prevalece
        // el Cliente real resuelto por el backend (Consumidor Final por defecto).
        nombre: this.nombreCliente || undefined,
        idcliente: this.selectedClienteId || undefined,
        idsucursal: session.user.idsucursal ?? undefined,
        idusuario: session.user.id,
        total_orden: total,
        detalles: this.detalles().map((d) => ({
          idprodPresenta: d.idprodPresenta,
          cantidad: d.cantidad,
          precio: d.precio,
        })),
        // Una cotización todavía no cobra nada — se omite el pago.
        pago: this.esCotizacion ? undefined : { idtipopago: 3, importe: total, estado: 'Pagado' },
        esCotizacion: this.esCotizacion,
        idTipoCliVenta: this.selectedTipoVentaId,
      })
      .subscribe({
        next: (venta: Venta) => {
          localStorage.removeItem(PENDING_KEY);
          this.snackBar.open(
            this.esCotizacion ? 'Cotización registrada' : 'Venta registrada',
            'Cerrar',
            { duration: 2000 },
          );
          if (!this.esCotizacion) {
            this.dialog.open(TicketVentaComponent, { width: '520px', data: venta, autoFocus: false });
          }
          this.router.navigate(['/ventas']);
        },
        error: (err) =>
          this.snackBar.open(err.error?.message || 'Error al registrar venta', 'Cerrar', {
            duration: 5000,
          }),
      });
  }
}
