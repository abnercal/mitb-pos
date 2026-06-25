import { Component, OnInit, inject, signal, computed, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductoService } from '../core/services/producto.service';
import { ClienteService } from '../core/services/cliente.service';
import { VentaService } from '../core/services/venta.service';
import { AuthService } from '../core/services/auth.service';
import { PrecioService } from '../core/services/precio.service';
import { AppEventsService } from '../core/services/app-events.service';
import { TipoPagoService } from '../core/services/tipo-pago.service';
import { Producto } from '../core/interfaces/producto.interface';
import { Cliente } from '../core/interfaces/cliente.interface';
import { Venta } from '../core/interfaces/venta.interface';
import { ProductoPresentacion } from '../core/interfaces/producto-presentacion.interface';
import { TipoPago } from '../core/interfaces/tipo-pago.interface';
import { TicketVentaComponent } from '../shared/components/ticket-venta.component';
import { PosPresDialog, PosConfirmDialog, PosShortcutsDialog } from './dialogs';

interface CartItem {
  idprodPresenta: number;
  nombre: string;
  presentacion: string;
  cantidad: number;
  precio: number;
  tipoprecio?: string;
}

const PENDING_SALE_KEY = 'pos_pending_sale';

interface PendingSale {
  items: CartItem[];
  clientId: number | null;
  tipoPagoId: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    MatSelectModule,
    MatCardModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    @if (isMobile()) {
      <button class="cart-fab" (click)="showCart.set(!showCart())" matTooltip="Carrito">
        <mat-icon>shopping_cart</mat-icon>
        @if (cartItems().length) {
          <span class="cart-fab-badge">{{ cartItems().length }}</span>
        }
      </button>
    }

    @if (hasPendingSale() && !showCart()) {
      <div class="pending-bar" (click)="showCart.set(true)" (keydown.enter)="showCart.set(true)" tabindex="0">
        <mat-icon>restore</mat-icon>
        <span
          >Venta pendiente — {{ cartItems().length }} producto{{
            cartItems().length !== 1 ? 's' : ''
          }}</span
        >
      </div>
    }

    <div class="pos-layout" [class.pos-layout--cart-open]="showCart()">
      <div class="pos-products">
        <div class="search-bar">
          <mat-icon class="search-icon">search</mat-icon>
          <input
            #searchInput
            class="search-input"
            [(ngModel)]="searchTerm"
            (keydown)="onSearchKeydown($event)"
            placeholder="Buscá producto por nombre, código, marca o escaneá…"
          />
          @if (isScanning()) {
            <span class="scan-indicator">Escaneando…</span>
          }
          @if (searchTerm()) {
            <button mat-icon-button (click)="searchTerm.set('')" class="clear-btn">
              <mat-icon>close</mat-icon>
            </button>
          }
          <button
            mat-mini-fab
            color="accent"
            (click)="openScanner()"
            matTooltip="Escanear código de barras"
            class="scan-btn"
          >
            <mat-icon>qr_code_scanner</mat-icon>
          </button>
        </div>

        @if (searchTerm()) {
          <div class="product-count">
            {{ filteredProducts().length }} producto{{
              filteredProducts().length !== 1 ? 's' : ''
            }}
            encontrado{{ filteredProducts().length !== 1 ? 's' : '' }}
          </div>
        }

        @if (loading()) {
          <div class="product-sk-grid">
            @for (_ of [1,2,3,4,5,6]; track _) {
              <div class="product-sk-card">
                <div class="sk-line sk-line--name pulse"></div>
                <div class="sk-line sk-line--brand pulse"></div>
                <div class="sk-line sk-line--price pulse"></div>
              </div>
            }
          </div>
        } @else if (productsError()) {
          <div class="products-error">
            <mat-icon>error_outline</mat-icon>
            <p>{{ productsError() }}</p>
            <button mat-button color="primary" (click)="loadProducts()">Reintentar</button>
          </div>
        } @else {
          <div class="product-grid">
            @for (p of filteredProducts(); track p; let idx = $index) {
              <button
                class="product-card"
                [class.product-card--selected]="selectedProductIndex() === idx"
                (click)="selectProduct(p)"
                (mouseenter)="selectedProductIndex.set(idx)"
              >
                <span class="prod-name">{{ p.nombre }}</span>
                <span class="prod-marca">{{ p.Marca?.nombre || '' }}</span>
                @if (p.Presentaciones && p.Presentaciones.length === 1) {
                  <span class="prod-price"
                    >Q {{ p.Presentaciones[0].precio_venta || 0 | number: '.2' }}</span
                  >
                }
                @if (!p.Presentaciones || p.Presentaciones.length !== 1) {
                  <span class="prod-pres-count"
                    >{{ p.Presentaciones?.length || 0 }} presentacione{{
                      (p.Presentaciones?.length || 0) !== 1 ? 's' : ''
                    }}</span
                  >
                }
              </button>
            }
          </div>

          @if (!filteredProducts().length && searchTerm()) {
            <div class="empty-search">
              <mat-icon>search_off</mat-icon>
              <p>No se encontraron productos para "{{ searchTerm() }}"</p>
            </div>
          }
        }
      </div>

      <div class="pos-cart" [class.pos-cart--open]="showCart()">
        <div class="cart-header">
          <div class="cart-header-top">
            <h2>Venta</h2>
            @if (isMobile()) {
              <button mat-icon-button (click)="showCart.set(false)" class="close-cart-btn">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Cliente</mat-label>
            <mat-select [(value)]="selectedClientId">
              <mat-option [value]="null">Mostrador</mat-option>
              @for (c of clientes; track c) {
                <mat-option [value]="c._id">{{ c.nombres }} {{ c.apellidos }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo de pago</mat-label>
            <mat-select [(value)]="selectedTipoPagoId">
              @for (t of tiposPago; track t) {
                <mat-option [value]="t.idtipopago">{{ t.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-divider></mat-divider>

        <div class="cart-items">
          @if (!cartItems().length) {
            <div class="empty-cart">
              <mat-icon>add_shopping_cart</mat-icon>
              <p>Seleccioná un producto y elegí su presentación</p>
            </div>
          }

          @for (item of cartItems(); track item; let i = $index) {
            <div class="cart-item">
              <div class="item-info">
                <span class="item-name">{{ item.nombre }}</span>
                <span class="item-pres">{{ item.presentacion }}</span>
                <span class="item-price">Q {{ item.precio | number: '.2' }}</span>
                @if (item.tipoprecio && item.tipoprecio !== 'regular') {
                  <span class="price-badge">{{ item.tipoprecio }}</span>
                }
              </div>
              <div class="item-controls">
                <button mat-icon-button (click)="updateQty(i, item.cantidad - 1)" class="qty-btn">
                  <mat-icon>remove</mat-icon>
                </button>
                <span class="item-qty">{{ item.cantidad }}</span>
                <button mat-icon-button (click)="updateQty(i, item.cantidad + 1)" class="qty-btn">
                  <mat-icon>add</mat-icon>
                </button>
                <span class="item-subtotal"
                  >Q {{ item.cantidad * item.precio | number: '.2' }}</span
                >
                <button mat-icon-button (click)="removeItem(i)" class="remove-btn">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>

        <mat-divider></mat-divider>

        <div class="cart-footer">
          <div class="cart-total">
            <span>Total</span>
            <span class="total-amount">Q {{ cartTotal() | number: '.2' }}</span>
          </div>
          <button
            mat-raised-button
            color="primary"
            class="pay-btn"
            [disabled]="!cartItems().length"
            (click)="checkout()"
          >
            <mat-icon>payments</mat-icon>
            Cobrar — Q {{ cartTotal() | number: '.2' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './pos.component.scss',
})
export default class PosComponent implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly ventaService = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly tipoPagoService = inject(TipoPagoService);
  private readonly precioService = inject(PrecioService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly appEvents = inject(AppEventsService);

  readonly loading = signal(true);
  readonly productsError = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly allProducts = signal<Producto[]>([]);
  clientes: Cliente[] = [];
  selectedClientId: number | null = null;
  selectedTipoPagoId = 3;
  tiposPago: TipoPago[] = [];

  readonly cartItems = signal<CartItem[]>([]);
  readonly hasPendingSale = signal(false); // para mostrar indicador visual

  readonly cartTotal = computed(() =>
    this.cartItems().reduce((sum, i) => sum + i.cantidad * i.precio, 0),
  );

  private lastKeyTime = 0;
  private scanBuffer = '';
  private readonly SCAN_THRESHOLD = 80;

  readonly isScanning = signal(false);
  readonly selectedProductIndex = signal(-1);
  readonly isMobile = signal(window.innerWidth < 900);
  readonly showCart = signal(false);

  constructor() {
    // Auto-guardar venta pendiente cada vez que cambia el carrito o los selects
    effect(() => {
      const items = this.cartItems();
      const hasItems = items.length > 0;
      this.hasPendingSale.set(hasItems);
      if (hasItems) {
        this.savePendingSale();
      } else {
        localStorage.removeItem(PENDING_SALE_KEY);
      }
    });
  }

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

  ngOnInit(): void {
    this.loadProducts();
    this.clienteService.getAllList().subscribe((r) => (this.clientes = r));
    this.tipoPagoService.getAll().subscribe((r) => (this.tiposPago = r));

    // Restaurar venta pendiente si existe
    this.loadPendingSale();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productsError.set(null);
    this.productoService.getAllList().subscribe({
      next: (r) => {
        this.allProducts.set(r);
        this.loading.set(false);
        this.selectedProductIndex.set(-1);
      },
      error: () => {
        this.productsError.set('No se pudieron cargar los productos');
        this.loading.set(false);
      },
    });
  }

  /** Guarda el carrito actual en localStorage */
  private savePendingSale(): void {
    const data: PendingSale = {
      items: this.cartItems(),
      clientId: this.selectedClientId,
      tipoPagoId: this.selectedTipoPagoId,
    };
    localStorage.setItem(PENDING_SALE_KEY, JSON.stringify(data));
  }

  /** Restaura una venta pendiente desde localStorage */
  private loadPendingSale(): void {
    const raw = localStorage.getItem(PENDING_SALE_KEY);
    if (!raw) return;
    try {
      const data: PendingSale = JSON.parse(raw);
      if (!data.items?.length) return;
      this.cartItems.set(data.items);
      this.selectedClientId = data.clientId ?? null;
      this.selectedTipoPagoId = data.tipoPagoId ?? 3;
      this.showCart.set(true);
      this.snackBar.open(
        `Hay una venta pendiente con ${data.items.length} producto${data.items.length !== 1 ? 's' : ''}`,
        'Ver',
        { duration: 5000 },
      );
    } catch {
      localStorage.removeItem(PENDING_SALE_KEY);
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const isInput =
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    if (event.key === 'F1' || (event.key === '?' && !event.shiftKey && !isInput)) {
      event.preventDefault();
      this.dialog.open(PosShortcutsDialog, { width: '380px' });
      return;
    }

    if (event.ctrlKey && event.key === 'n') {
      event.preventDefault();
      this.newSale();
      return;
    }

    if (event.key === 'Escape') {
      if (this.showCart()) {
        this.showCart.set(false);
        return;
      }
      if (this.searchTerm()) {
        this.searchTerm.set('');
        this.selectedProductIndex.set(-1);
        return;
      }
      return;
    }

    if (isInput) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const len = this.filteredProducts().length;
      if (len === 0) return;
      this.selectedProductIndex.update((i) => (i + 1) % len);
      const cards = document.querySelectorAll('.product-card');
      cards[this.selectedProductIndex()]?.scrollIntoView({ block: 'nearest' });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const len = this.filteredProducts().length;
      if (len === 0) return;
      this.selectedProductIndex.update((i) => (i <= 0 ? len - 1 : i - 1));
      const cardsUp = document.querySelectorAll('.product-card');
      cardsUp[this.selectedProductIndex()]?.scrollIntoView({ block: 'nearest' });
      return;
    }

    if (event.key === 'Enter' && this.selectedProductIndex() >= 0) {
      const p = this.filteredProducts()[this.selectedProductIndex()];
      if (p) this.selectProduct(p);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile.set(window.innerWidth < 900);
    if (!this.isMobile()) this.showCart.set(false);
  }

  newSale(): void {
    this.cartItems.set([]);
    this.searchTerm.set('');
    this.selectedClientId = null;
    this.selectedTipoPagoId = 3;
    this.selectedProductIndex.set(-1);
    this.showCart.set(false);
    localStorage.removeItem(PENDING_SALE_KEY);
    this.snackBar.open('Nueva venta iniciada', 'Cerrar', { duration: 1500 });
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const now = Date.now();
    const elapsed = now - this.lastKeyTime;
    this.lastKeyTime = now;

    if (event.key === 'Enter') {
      if (elapsed < this.SCAN_THRESHOLD && this.scanBuffer.length >= 3) {
        event.preventDefault();
        const code = this.scanBuffer;
        this.scanBuffer = '';
        this.isScanning.set(false);
        this.handleBarcodeScan(code);
      }
      return;
    }

    if (event.key.length === 1) {
      if (elapsed < this.SCAN_THRESHOLD) {
        this.scanBuffer += event.key;
        this.isScanning.set(true);
      } else {
        this.scanBuffer = event.key;
        this.isScanning.set(false);
      }
    }
  }

  private handleBarcodeScan(code: string): void {
    this.productoService.getAll(1, 10, code).subscribe({
      next: (result) => {
        const productos = result.data;
        if (productos.length === 0) {
          this.snackBar.open(`Producto no encontrado: ${code}`, 'Cerrar', { duration: 3000 });
          return;
        }

        if (productos.length === 1) {
          const p = productos[0];
          const pres = p.Presentaciones?.filter((pp) => pp.estado !== 0) || [];
          if (pres.length === 1) {
            this.addToCart(p, pres[0]);
            this.snackBar.open(`${p.nombre} agregado`, 'Cerrar', { duration: 2000 });
          } else if (pres.length > 1) {
            this.selectProduct(p);
          } else {
            this.snackBar.open('Producto sin presentaciones activas', 'Cerrar', { duration: 2000 });
          }
        } else {
          this.searchTerm.set(code);
        }
      },
      error: () => this.snackBar.open('Error al buscar producto', 'Cerrar', { duration: 2000 }),
    });
  }

  async openScanner(): Promise<void> {
    const { BarcodeScannerComponent } = await import('./barcode-scanner.component');
    const ref = this.dialog.open(BarcodeScannerComponent, {
      width: '500px',
      disableClose: true,
      data: {
        onDetect: () => Promise.resolve(true),
      },
    });
    ref.afterClosed().subscribe((code: string | null) => {
      if (code) this.handleBarcodeScan(code);
    });
  }

  selectProduct(p: Producto): void {
    const pres = p.Presentaciones?.filter((pp) => pp.estado !== 0) || [];

    if (pres.length === 0) {
      this.snackBar.open('Este producto no tiene presentaciones activas', 'Cerrar', {
        duration: 2000,
      });
      return;
    }

    if (pres.length === 1) {
      this.addToCart(p, pres[0]);
      return;
    }

    const ref = this.dialog.open(PosPresDialog, {
      width: '420px',
      data: { producto: p, presentaciones: pres },
    });

    ref.afterClosed().subscribe((selected: ProductoPresentacion | null) => {
      if (selected) this.addToCart(p, selected);
    });
  }

  private addToCart(p: Producto, pp: ProductoPresentacion): void {
    const existing = this.cartItems().find((i) => i.idprodPresenta === pp.idprodPresenta);

    if (existing) {
      this.cartItems.update((items) =>
        items.map((i) =>
          i.idprodPresenta === pp.idprodPresenta ? { ...i, cantidad: i.cantidad + 1 } : i,
        ),
      );
      return;
    }

    const baseItem = {
      idprodPresenta: pp.idprodPresenta!,
      nombre: p.nombre,
      presentacion: pp.Presentacion?.nombre || '',
      cantidad: 1,
      precio: Number(pp.precio_venta) || 0,
    };

    if (this.selectedClientId != null) {
      const cliente = this.clientes.find((c) => c._id === this.selectedClientId);
      const idtipoCli = cliente?.idtipoCli;

      if (idtipoCli != null) {
        this.precioService.getByPresentacion(pp.idprodPresenta!, idtipoCli).subscribe({
          next: (res) => {
            this.cartItems.update((items) => [
              ...items,
              {
                ...baseItem,
                precio: Number(res.precio),
                tipoprecio: res.fuente === 'precio_especifico' ? res.tipoprecio : undefined,
              },
            ]);
          },
          error: () => {
            console.warn(
              `No se pudo obtener precio para presentación ${pp.idprodPresenta}, usando precio_venta`,
            );
            this.cartItems.update((items) => [...items, { ...baseItem }]);
          },
        });
        return;
      }
    }

    this.cartItems.update((items) => [...items, { ...baseItem }]);
  }

  updateQty(index: number, qty: number): void {
    if (qty <= 0) {
      this.removeItem(index);
      return;
    }
    this.cartItems.update((items) =>
      items.map((item, i) => (i === index ? { ...item, cantidad: qty } : item)),
    );
  }

  removeItem(index: number): void {
    this.cartItems.update((items) => items.filter((_, i) => i !== index));
  }

  checkout(): void {
    if (!this.cartItems().length) return;

    const total = this.cartTotal();
    const ref = this.dialog.open(PosConfirmDialog, {
      width: '400px',
      data: { total, items: this.cartItems().length },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      const session = this.authService.getSession();
      if (!session) {
        this.snackBar.open('No hay sesión activa', 'Cerrar', { duration: 3000 });
        return;
      }

      const payload = {
        nombre: `POS-${Date.now()}`,
        idcliente: this.selectedClientId || undefined,
        idsucursal: session.user.idsucursal ?? undefined,
        idusuario: session.user.id,
        total_orden: total,
        detalles: this.cartItems().map((i) => ({
          idprodPresenta: i.idprodPresenta,
          cantidad: i.cantidad,
          precio: i.precio,
        })),
        pago: { idtipopago: this.selectedTipoPagoId, importe: total, estado: 'pagado' },
      };

      this.ventaService.create(payload).subscribe({
        next: (venta: Venta) => {
          this.snackBar.open('Venta registrada', 'Cerrar', { duration: 3000 });
          this.cartItems.set([]);
          localStorage.removeItem(PENDING_SALE_KEY);
          this.searchTerm.set('');
          this.selectedClientId = null;
          this.selectedTipoPagoId = 3;
          this.appEvents.notifySaleCompleted();
          this.dialog.open(TicketVentaComponent, {
            width: '520px',
            data: venta,
            autoFocus: false,
          });
        },
        error: () => this.snackBar.open('Error al registrar venta', 'Cerrar', { duration: 3000 }),
      });
    });
  }
}
