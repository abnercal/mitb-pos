import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
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
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductoService } from '../core/services/producto.service';
import { ClienteService } from '../core/services/cliente.service';
import { VentaService } from '../core/services/venta.service';
import { AuthService } from '../core/services/auth.service';
import { PrecioService } from '../core/services/precio.service';
import { Producto } from '../core/interfaces/producto.interface';
import { Cliente } from '../core/interfaces/cliente.interface';
import { Venta } from '../core/interfaces/venta.interface';
import { TicketVentaComponent } from '../shared/components/ticket-venta.component';
import { ProductoPresentacion } from '../core/interfaces/producto-presentacion.interface';
import { TipoPagoService } from '../core/services/tipo-pago.service';
import { TipoPago } from '../core/interfaces/tipo-pago.interface';

interface CartItem {
  idprodPresenta: number;
  nombre: string;
  presentacion: string;
  cantidad: number;
  precio: number;
  tipoprecio?: string;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatTooltipModule,
    MatSelectModule, MatCardModule, MatDividerModule, MatSnackBarModule, MatDialogModule,
  ],
  template: `
    <!-- Mobile cart FAB -->
    <button
      *ngIf="isMobile()"
      class="cart-fab"
      (click)="showCart.set(!showCart())"
      matTooltip="Carrito"
    >
      <mat-icon>shopping_cart</mat-icon>
      <span class="cart-fab-badge" *ngIf="cartItems().length">{{ cartItems().length }}</span>
    </button>

    <div class="pos-layout" [class.pos-layout--cart-open]="showCart()">
      <!-- LEFT: Product Search -->
      <div class="pos-products">
        <div class="search-bar">
          <mat-icon class="search-icon">search</mat-icon>
          <input
            #searchInput
            class="search-input"
            [(ngModel)]="searchTerm"
            (keydown)="onSearchKeydown($event)"
            placeholder="Buscá producto por nombre, código, marca o escaneá…"
            autofocus
          >
          <span *ngIf="isScanning()" class="scan-indicator">Escaneando…</span>
          <button *ngIf="searchTerm()" mat-icon-button (click)="searchTerm.set('')" class="clear-btn">
            <mat-icon>close</mat-icon>
          </button>
          <button mat-mini-fab color="accent" (click)="openScanner()" matTooltip="Escanear código de barras" class="scan-btn">
            <mat-icon>qr_code_scanner</mat-icon>
          </button>
        </div>

        <div class="product-count" *ngIf="searchTerm()">
          {{ filteredProducts().length }} producto{{ filteredProducts().length !== 1 ? 's' : '' }} encontrado{{ filteredProducts().length !== 1 ? 's' : '' }}
        </div>

        <div class="product-grid">
          <button
            *ngFor="let p of filteredProducts(); let idx = index"
            class="product-card"
            [class.product-card--selected]="selectedProductIndex() === idx"
            (click)="selectProduct(p)"
            (mouseenter)="selectedProductIndex.set(idx)"
          >
            <span class="prod-name">{{ p.nombre }}</span>
            <span class="prod-marca">{{ p.Marca?.nombre || '' }}</span>
            <ng-container *ngIf="p.Presentaciones && p.Presentaciones.length === 1">
              <span class="prod-price">Q {{ (p.Presentaciones[0].precio_venta || 0) | number:'.2' }}</span>
            </ng-container>
            <ng-container *ngIf="!p.Presentaciones || p.Presentaciones.length !== 1">
              <span class="prod-pres-count">{{ (p.Presentaciones?.length || 0) }} presentacione{{ (p.Presentaciones?.length || 0) !== 1 ? 's' : '' }}</span>
            </ng-container>
          </button>
        </div>

        <div class="empty-search" *ngIf="!filteredProducts().length && searchTerm()">
          <mat-icon>search_off</mat-icon>
          <p>No se encontraron productos para "{{ searchTerm() }}"</p>
        </div>
      </div>

      <!-- RIGHT: Cart -->
      <div class="pos-cart" [class.pos-cart--open]="showCart()">
        <div class="cart-header">
          <div class="cart-header-top">
            <h2>Venta</h2>
            <button *ngIf="isMobile()" mat-icon-button (click)="showCart.set(false)" class="close-cart-btn">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Cliente</mat-label>
            <mat-select [(value)]="selectedClientId">
              <mat-option [value]="null">Mostrador</mat-option>
              <mat-option *ngFor="let c of clientes" [value]="c._id">{{ c.nombres }} {{ c.apellidos }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo de pago</mat-label>
            <mat-select [(value)]="selectedTipoPagoId">
              <mat-option *ngFor="let t of tiposPago" [value]="t.idtipopago">{{ t.nombre }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-divider></mat-divider>

        <div class="cart-items">
          <div *ngIf="!cartItems().length" class="empty-cart">
            <mat-icon>add_shopping_cart</mat-icon>
            <p>Seleccioná un producto y elegí su presentación</p>
          </div>

          <div *ngFor="let item of cartItems(); let i = index" class="cart-item">
            <div class="item-info">
              <span class="item-name">{{ item.nombre }}</span>
              <span class="item-pres">{{ item.presentacion }}</span>
              <span class="item-price">Q {{ item.precio | number:'.2' }}</span>
              <span *ngIf="item.tipoprecio && item.tipoprecio !== 'regular'" class="price-badge">{{ item.tipoprecio }}</span>
            </div>
            <div class="item-controls">
              <button mat-icon-button (click)="updateQty(i, item.cantidad - 1)" class="qty-btn"><mat-icon>remove</mat-icon></button>
              <span class="item-qty">{{ item.cantidad }}</span>
              <button mat-icon-button (click)="updateQty(i, item.cantidad + 1)" class="qty-btn"><mat-icon>add</mat-icon></button>
              <span class="item-subtotal">Q {{ (item.cantidad * item.precio) | number:'.2' }}</span>
              <button mat-icon-button (click)="removeItem(i)" class="remove-btn"><mat-icon>delete</mat-icon></button>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="cart-footer">
          <div class="cart-total">
            <span>Total</span>
            <span class="total-amount">Q {{ cartTotal() | number:'.2' }}</span>
          </div>
          <button
            mat-raised-button
            color="primary"
            class="pay-btn"
            [disabled]="!cartItems().length"
            (click)="checkout()"
          >
            <mat-icon>payments</mat-icon>
            Cobrar — Q {{ cartTotal() | number:'.2' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pos-layout { display: flex; height: calc(100vh - 112px); gap: 16px; margin: -24px; }

    /* LEFT - Products */
    .pos-products { flex: 1; display: flex; flex-direction: column; padding: 24px 0 24px 24px; overflow: hidden; }
    .search-bar { display: flex; align-items: center; background: #fff; border-radius: 8px; padding: 4px 16px; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
    .search-icon { color: #666; margin-right: 12px; }
    .search-input { flex: 1; border: none; outline: none; font-size: 20px; padding: 16px 0; background: transparent; }
    .scan-indicator { font-size: 12px; color: #1565c0; font-weight: 600; animation: pulse 1s infinite; margin-right: 8px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    .product-count { margin: 8px 0; color: #666; font-size: 13px; }
    .product-grid { flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; padding: 16px 0; overflow-y: auto; align-content: start; }
    .product-card { display: flex; flex-direction: column; padding: 16px; min-height: 72px; background: #fff; border-radius: 8px; border: 1px solid #e0e0e0; cursor: pointer; text-align: left; transition: all .15s; }
    .product-card:hover, .product-card--selected { border-color: #1565c0; box-shadow: 0 2px 8px rgba(21,101,192,.3); transform: translateY(-1px); }
    .product-card--selected { background: #e3f2fd; }
    .prod-name { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
    .prod-marca { font-size: 12px; color: #999; }
    .prod-price { font-size: 16px; color: #1565c0; font-weight: 700; margin-top: 4px; }
    .prod-pres-count { font-size: 11px; color: #1565c0; font-weight: 500; margin-top: 6px; }
    .empty-search { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #999; }
    .empty-search mat-icon { font-size: 64px; width: 64px; height: 64px; }

    /* RIGHT - Cart */
    .pos-cart { width: 380px; display: flex; flex-direction: column; background: #fff; border-left: 1px solid #e0e0e0; }
    .cart-header { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .cart-header-top { display: flex; justify-content: space-between; align-items: center; }
    .cart-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
    .close-cart-btn { }
    .full-width { width: 100%; }
    .cart-items { flex: 1; overflow-y: auto; padding: 12px 16px; }
    .empty-cart { display: flex; flex-direction: column; align-items: center; padding: 40px; color: #bbb; }
    .empty-cart mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
    .cart-item { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
    .item-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px; }
    .item-name { font-weight: 500; font-size: 14px; }
    .item-pres { font-size: 11px; color: #666; padding: 2px 8px; background: #e8f0fe; border-radius: 4px; }
    .item-price { color: #1565c0; font-weight: 600; font-size: 13px; }
    .price-badge { font-size: 10px; font-weight: 600; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: #ff9800; color: #fff; margin-left: 6px; }
    .item-controls { display: flex; align-items: center; gap: 8px; }
    .qty-btn { width: 32px; height: 32px; line-height: 32px; }
    .qty-btn mat-icon { font-size: 18px; }
    .item-qty { font-size: 16px; font-weight: 600; min-width: 24px; text-align: center; }
    .item-subtotal { margin-left: auto; font-weight: 600; font-size: 14px; }
    .remove-btn { width: 28px; height: 28px; line-height: 28px; }
    .remove-btn mat-icon { font-size: 16px; color: #e53935; }

    .cart-footer { padding: 16px 20px; }
    .cart-total { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 16px; }
    .total-amount { font-size: 28px; font-weight: 800; color: #1565c0; }
    .pay-btn { width: 100%; padding: 20px; font-size: 18px; }

    /* Mobile cart FAB */
    .cart-fab {
      position: fixed; bottom: 24px; right: 24px; z-index: 1000;
      width: 60px; height: 60px; border-radius: 50%;
      background: #1565c0; color: #fff; border: none;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(21,101,192,.4); cursor: pointer;
    }
    .cart-fab mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .cart-fab-badge {
      position: absolute; top: -4px; right: -4px;
      background: #e53935; color: #fff;
      width: 22px; height: 22px; border-radius: 50%;
      font-size: 12px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }

    /* ---- Responsive ---- */
    @media (max-width: 899px) {
      .pos-layout { flex-direction: column; height: auto; min-height: calc(100vh - 112px); margin: -16px; gap: 0; }
      .pos-products { padding: 16px; }
      .product-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
      .pos-cart { position: fixed; top: 0; right: -100%; width: 100%; height: 100%; z-index: 999; border-left: none; transition: right .25s ease; }
      .pos-cart--open { right: 0; }
      .cart-header { padding-top: 48px; }
    }

    @media (max-width: 599px) {
      .pos-layout { margin: -8px; }
      .pos-products { padding: 8px; }
      .search-input { font-size: 18px; padding: 14px 0; }
      .product-grid { grid-template-columns: 1fr; }
      .product-card { padding: 14px; min-height: 64px; }
      .qty-btn { width: 40px; height: 40px; }
      .pay-btn { padding: 16px; font-size: 16px; }
      .scan-btn { width: 40px; height: 40px; }
      .scan-btn mat-icon { font-size: 22px; }
    }
  `],
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

  readonly searchTerm = signal('');
  readonly allProducts = signal<Producto[]>([]);
  readonly clientes: Cliente[] = [];
  selectedClientId: number | null = null;
  tiposPago: TipoPago[] = [];
  selectedTipoPagoId = 3;

  readonly cartItems = signal<CartItem[]>([]);

  readonly cartTotal = computed(() =>
    this.cartItems().reduce((sum, i) => sum + i.cantidad * i.precio, 0)
  );

  /** Scanner físico: buffer para detectar escritura rápida + Enter */
  private lastKeyTime = 0;
  private scanBuffer = '';
  private readonly SCAN_THRESHOLD = 80;

  readonly isScanning = signal(false);

  /** Navegación con teclado */
  readonly selectedProductIndex = signal(-1);

  /** Responsive */
  readonly isMobile = signal(window.innerWidth < 900);
  readonly showCart = signal(false);

  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.allProducts();
    return this.allProducts().filter(p =>
      p.nombre.toLowerCase().includes(term) ||
      String(p.codigoprod).includes(term) ||
      (p.Marca?.nombre && p.Marca.nombre.toLowerCase().includes(term)) ||
      p.Presentaciones?.some(pp => pp.codigo_barras?.toLowerCase().includes(term))
    );
  });

  ngOnInit(): void {
    this.productoService.getAllList().subscribe(r => this.allProducts.set(r));
    this.clienteService.getAllList().subscribe(r => (this as any).clientes = r);
    this.tipoPagoService.getAll().subscribe(r => this.tiposPago = r);
    this.selectedProductIndex.set(-1);
  }

  // ─── Atajos de teclado globales ──────────────────────────────────────
  @HostListener('document:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // F1 o ? → ayuda
    if (event.key === 'F1' || (event.key === '?' && !event.shiftKey && !isInput)) {
      event.preventDefault();
      this.showShortcutsHelp();
      return;
    }

    // Ctrl+N → nueva venta
    if (event.ctrlKey && event.key === 'n') {
      event.preventDefault();
      this.newSale();
      return;
    }

    // Escape → limpiar búsqueda o cerrar carrito en mobile
    if (event.key === 'Escape') {
      if (this.showCart()) { this.showCart.set(false); return; }
      if (this.searchTerm()) { this.searchTerm.set(''); this.selectedProductIndex.set(-1); return; }
      return;
    }

    // Flechas y Enter solo cuando NO estamos en un input
    if (isInput) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const len = this.filteredProducts().length;
      if (len === 0) return;
      this.selectedProductIndex.update(i => (i + 1) % len);
      // Scroll into view
      const cards = document.querySelectorAll('.product-card');
      cards[this.selectedProductIndex()]?.scrollIntoView({ block: 'nearest' });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const len = this.filteredProducts().length;
      if (len === 0) return;
      this.selectedProductIndex.update(i => (i <= 0 ? len - 1 : i - 1));
      const cards = document.querySelectorAll('.product-card');
      cards[this.selectedProductIndex()]?.scrollIntoView({ block: 'nearest' });
      return;
    }

    if (event.key === 'Enter' && this.selectedProductIndex() >= 0) {
      const p = this.filteredProducts()[this.selectedProductIndex()];
      if (p) this.selectProduct(p);
      return;
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile.set(window.innerWidth < 900);
    if (!this.isMobile()) this.showCart.set(false);
  }

  /** Iniciar nueva venta (limpia todo) */
  newSale(): void {
    this.cartItems.set([]);
    this.searchTerm.set('');
    this.selectedProductIndex.set(-1);
    this.showCart.set(false);
    this.snackBar.open('Nueva venta iniciada', 'Cerrar', { duration: 1500 });
  }

  /** Dialog con ayuda de atajos */
  showShortcutsHelp(): void {
    this.dialog.open(PosShortcutsDialog, { width: '380px' });
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const now = Date.now();
    const elapsed = now - this.lastKeyTime;
    this.lastKeyTime = now;

    if (event.key === 'Enter') {
      // Si viene de scanner (escritura rápida + Enter), buscar directo
      if (elapsed < this.SCAN_THRESHOLD && this.scanBuffer.length >= 3) {
        event.preventDefault();
        const code = this.scanBuffer;
        this.scanBuffer = '';
        this.isScanning.set(false);
        this.handleBarcodeScan(code);
      }
      return;
    }

    // Ignorar teclas de control
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
    // Buscar en backend por el código escaneado
    this.productoService.getAll(1, 10, code).subscribe({
      next: (result) => {
        const productos = result.data;
        if (productos.length === 0) {
          this.snackBar.open(`Producto no encontrado: ${code}`, 'Cerrar', { duration: 3000 });
          return;
        }

        // Si hay un solo producto, seleccionarlo
        if (productos.length === 1) {
          const p = productos[0];
          const pres = p.Presentaciones?.filter(pp => pp.estado !== 0) || [];
          if (pres.length === 1) {
            this.addToCart(p, pres[0]);
            this.snackBar.open(`${p.nombre} agregado`, 'Cerrar', { duration: 2000 });
          } else if (pres.length > 1) {
            this.selectProduct(p);
          } else {
            this.snackBar.open('Producto sin presentaciones activas', 'Cerrar', { duration: 2000 });
          }
        } else {
          // Múltiples productos: mostrar en la grilla filtrando
          this.searchTerm.set(code);
        }
      },
      error: () => {
        this.snackBar.open('Error al buscar producto', 'Cerrar', { duration: 2000 });
      },
    });
  }

  async openScanner(): Promise<void> {
    const { BarcodeScannerComponent } = await import('./barcode-scanner.component');
    const ref = this.dialog.open(BarcodeScannerComponent, {
      width: '500px',
      disableClose: true,
      data: {
        onDetect: (code: string) => {
          // Verificar si el código existe en backend
          return new Promise<boolean>((resolve) => {
            this.productoService.getAll(1, 10, code).subscribe({
              next: (result) => resolve(result.data.length > 0),
              error: () => resolve(false),
            });
          });
        },
      },
    });
    ref.afterClosed().subscribe((code: string | null) => {
      if (code) this.handleBarcodeScan(code);
    });
  }

  /** Al hacer click en un producto, abre selector de presentaciones */
  selectProduct(p: Producto): void {
    const pres = p.Presentaciones?.filter(pp => pp.estado !== 0) || [];

    if (pres.length === 0) {
      this.snackBar.open('Este producto no tiene presentaciones activas', 'Cerrar', { duration: 2000 });
      return;
    }

    if (pres.length === 1) {
      // Solo una presentación: agregar directo
      this.addToCart(p, pres[0]);
      return;
    }

    // Múltiples presentaciones: mostrar diálogo
    const ref = this.dialog.open(PosPresDialog, {
      width: '420px',
      data: { producto: p, presentaciones: pres },
    });

    ref.afterClosed().subscribe((selected: ProductoPresentacion | null) => {
      if (selected) this.addToCart(p, selected);
    });
  }

  private addToCart(p: Producto, pp: ProductoPresentacion): void {
    const existing = this.cartItems().find(
      i => i.idprodPresenta === pp.idprodPresenta
    );
    if (existing) {
      this.cartItems.update(items =>
        items.map(i =>
          i.idprodPresenta === pp.idprodPresenta
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        )
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

    // Si hay cliente seleccionado, consultar precio según su tipo
    if (this.selectedClientId != null) {
      const cliente = (this as any).clientes.find((c: any) => c._id === this.selectedClientId);
      const idtipoCli = cliente?.idtipoCli;

      if (idtipoCli != null) {
        this.precioService.getByPresentacion(pp.idprodPresenta!, idtipoCli).subscribe({
          next: (res) => {
            this.cartItems.update(items => [
              ...items,
              {
                ...baseItem,
                precio: Number(res.precio),
                tipoprecio: res.fuente === 'precio_especifico' ? res.tipoprecio : undefined,
              },
            ]);
          },
          error: () => {
            // Fallback silencioso a precio_venta
            console.warn(`No se pudo obtener precio para presentación ${pp.idprodPresenta}, usando precio_venta`);
            this.cartItems.update(items => [...items, { ...baseItem }]);
          },
        });
        return;
      }
    }

    // Sin cliente o sin tipo de cliente: usar precio_venta directo
    this.cartItems.update(items => [...items, { ...baseItem }]);
  }

  updateQty(index: number, qty: number): void {
    if (qty <= 0) { this.removeItem(index); return; }
    this.cartItems.update(items =>
      items.map((item, i) => i === index ? { ...item, cantidad: qty } : item)
    );
  }

  removeItem(index: number): void {
    this.cartItems.update(items => items.filter((_, i) => i !== index));
  }

  checkout(): void {
    if (!this.cartItems().length) return;

    const total = this.cartTotal();
    const ref = this.dialog.open(PosConfirmDialog, {
      width: '400px',
      data: { total, items: this.cartItems().length },
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      const session = this.authService.getSession();
      if (!session) {
        this.snackBar.open('No hay sesión activa', 'Cerrar', { duration: 3000 });
        return;
      }

      const payload = {
        nombre: `POS-${Date.now()}`,
        idcliente: this.selectedClientId || undefined,
        idsucursal: session.user.idsucursal,
        idusuario: session.user.id,
        total_orden: total,
        detalles: this.cartItems().map(i => ({
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
          this.searchTerm.set('');
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

// ─── Diálogo de selección de presentación ─────────────────────────────────
@Component({
  selector: 'app-pos-pres-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.producto.nombre }}</h2>
    <mat-dialog-content>
      <p class="pres-hint">Elegí la presentación para agregar al carrito:</p>
      <div class="pres-list">
        <button
          *ngFor="let pp of data.presentaciones"
          class="pres-btn"
          (click)="select(pp)"
        >
          <span class="pres-name">{{ pp.Presentacion?.nombre || 'Presentación' }}</span>
          <span class="pres-qty">x{{ pp.cantidad_base }} {{ data.producto.Unidad?.nombre || 'unid' }}</span>
          <span class="pres-price">Q {{ (pp.precio_venta || 0) | number:'.2' }}</span>
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .pres-hint { margin: 0 0 16px; color: #666; }
    .pres-list { display: flex; flex-direction: column; gap: 8px; }
    .pres-btn {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      transition: all .15s;
      width: 100%;
    }
    .pres-btn:hover { border-color: #1565c0; box-shadow: 0 2px 8px rgba(21,101,192,.15); }
    .pres-name { flex: 1; font-weight: 600; font-size: 15px; }
    .pres-qty { font-size: 12px; color: #666; background: #f5f5f5; padding: 2px 10px; border-radius: 4px; }
    .pres-price { font-weight: 700; font-size: 16px; color: #1565c0; }
  `],
})
export class PosPresDialog {
  readonly data = inject<{
    producto: Producto;
    presentaciones: ProductoPresentacion[];
  }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PosPresDialog>);

  select(pp: ProductoPresentacion): void {
    this.dialogRef.close(pp);
  }
}

// ─── Diálogo de confirmación ─────────────────────────────────────────────
@Component({
  selector: 'app-pos-confirm',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirmar venta</h2>
    <mat-dialog-content>
      <p>¿Cobrar <strong>Q {{ data.total | number:'.2' }}</strong> con <strong>{{ data.items }} producto{{ data.items !== 1 ? 's' : '' }}</strong>?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true">Cobrar</button>
    </mat-dialog-actions>
  `,
})
export class PosConfirmDialog {
  readonly data = inject<{ total: number; items: number }>(MAT_DIALOG_DATA);
}

// ─── Diálogo de ayuda de atajos ────────────────────────────────────────
@Component({
  selector: 'app-pos-shortcuts-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align:middle;margin-right:8px">keyboard</mat-icon>
      Atajos de teclado
    </h2>
    <mat-dialog-content>
      <div class="shortcut-row"><kbd>F1</kbd><span>Mostrar esta ayuda</span></div>
      <div class="shortcut-row"><kbd>?</kbd><span>Mostrar esta ayuda</span></div>
      <div class="shortcut-row"><kbd>Ctrl + N</kbd><span>Nueva venta</span></div>
      <div class="shortcut-row"><kbd>↑</kbd> <kbd>↓</kbd><span>Navegar productos</span></div>
      <div class="shortcut-row"><kbd>Enter</kbd><span>Agregar producto seleccionado</span></div>
      <div class="shortcut-row"><kbd>Esc</kbd><span>Limpiar búsqueda / cerrar carrito</span></div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .shortcut-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .shortcut-row kbd {
      display: inline-block; min-width: 48px; text-align: center;
      padding: 4px 10px; font-size: 13px; font-family: monospace;
      background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px;
    }
    .shortcut-row span { color: #555; }
  `],
})
export class PosShortcutsDialog {}
