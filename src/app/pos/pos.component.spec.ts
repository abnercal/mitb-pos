import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import PosComponent from './pos.component';
import { ProductoService } from '../core/services/producto.service';
import { ClienteService } from '../core/services/cliente.service';
import { VentaService } from '../core/services/venta.service';
import { AuthService } from '../core/services/auth.service';
import { PrecioService } from '../core/services/precio.service';
import { AppEventsService } from '../core/services/app-events.service';
import { TipoPagoService } from '../core/services/tipo-pago.service';
import type { Producto } from '../core/interfaces/producto.interface';
import type { ProductoPresentacion } from '../core/interfaces/producto-presentacion.interface';

const mockPresentacion: ProductoPresentacion = {
  idprodPresenta: 10,
  codigoprod: 100,
  idpresentacion: 1,
  cantidad_base: 1,
  precio_venta: 25.5,
  codigo_barras: '77912345',
  estado: 1,
  Presentacion: { nombre: 'Unidad' },
};

const mockPresentacion2: ProductoPresentacion = {
  idprodPresenta: 20,
  codigoprod: 200,
  idpresentacion: 2,
  cantidad_base: 12,
  precio_venta: 180,
  codigo_barras: '77999999',
  estado: 1,
  Presentacion: { nombre: 'Caja' },
};

const mockProducto: Producto = {
  codigoprod: 100,
  nombre: 'Leche',
  estado: 1,
  Marca: { nombre: 'Marca A' },
  Presentaciones: [mockPresentacion, mockPresentacion2],
};

const mockProducto2: Producto = {
  codigoprod: 200,
  nombre: 'Pan',
  estado: 1,
  Marca: { nombre: 'Marca B' },
  Presentaciones: [
    {
      idprodPresenta: 30,
      codigoprod: 200,
      idpresentacion: 1,
      cantidad_base: 1,
      precio_venta: 15,
      codigo_barras: '77999999',
      estado: 1,
      Presentacion: { nombre: 'Unidad' },
    },
  ],
};

describe('PosComponent', () => {
  let component: PosComponent;
  let fixture: ComponentFixture<PosComponent>;
  let productoService: { getAllList: ReturnType<typeof vi.fn> };
  let ventaService: { create: ReturnType<typeof vi.fn> };
  let precioService: { getByPresentacion: ReturnType<typeof vi.fn> };
  let authService: { getSession: ReturnType<typeof vi.fn> };
  let appEvents: { notifySaleCompleted: ReturnType<typeof vi.fn>; saleCompleted$: Subject<void> };
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    productoService = { getAllList: vi.fn().mockReturnValue(of([mockProducto, mockProducto2])) };
    ventaService = { create: vi.fn() };
    precioService = { getByPresentacion: vi.fn() };
    authService = {
      getSession: vi.fn().mockReturnValue({ token: 'x', user: { id: 1, idsucursal: 1 } }),
    };
    appEvents = { notifySaleCompleted: vi.fn(), saleCompleted$: new Subject<void>() };
    snackBar = { open: vi.fn() };
    dialog = { open: vi.fn() };

    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [PosComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        { provide: ProductoService, useValue: productoService },
        { provide: ClienteService, useValue: { getAllList: () => of([]) } },
        { provide: VentaService, useValue: ventaService },
        { provide: TipoPagoService, useValue: { getAll: () => of([]) } },
        { provide: PrecioService, useValue: precioService },
        { provide: AuthService, useValue: authService },
        { provide: AppEventsService, useValue: appEvents },
      ],
    });

    TestBed.overrideProvider(MatSnackBar, { useValue: snackBar });
    TestBed.overrideProvider(MatDialog, { useValue: dialog });

    fixture = TestBed.createComponent(PosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creación ──────────────────────────────────────────

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    expect(productoService.getAllList).toHaveBeenCalledTimes(1);
  });

  it('should clear pending sale state on init', () => {
    expect(component.hasPendingSale()).toBe(false);
    expect(component.loading()).toBe(false);
  });

  // ── cartTotal ─────────────────────────────────────────

  describe('cartTotal', () => {
    it('should be 0 when cart is empty', () => {
      expect(component.cartTotal()).toBe(0);
    });

    it('should sum item price * quantity', () => {
      component.cartItems.set([
        { idprodPresenta: 1, nombre: 'Item A', presentacion: 'Unidad', cantidad: 2, precio: 10 },
        { idprodPresenta: 2, nombre: 'Item B', presentacion: 'Caja', cantidad: 1, precio: 25 },
      ]);
      expect(component.cartTotal()).toBe(45); // 2*10 + 1*25
    });

    it('should handle fractional prices', () => {
      component.cartItems.set([
        { idprodPresenta: 1, nombre: 'Item', presentacion: 'Unidad', cantidad: 3, precio: 1.5 },
      ]);
      expect(component.cartTotal()).toBe(4.5);
    });
  });

  // ── filteredProducts ──────────────────────────────────

  describe('filteredProducts', () => {
    it('should return all products when search is empty', () => {
      component.searchTerm.set('');
      expect(component.filteredProducts().length).toBe(2);
    });

    it('should filter by product name (case insensitive)', () => {
      component.searchTerm.set('leche');
      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].nombre).toBe('Leche');
    });

    it('should filter by codigoprod', () => {
      component.searchTerm.set('200');
      const results = component.filteredProducts();
      expect(results.length).toBe(1);
      expect(results[0].codigoprod).toBe(200);
    });

    it('should filter by brand name', () => {
      component.searchTerm.set('marca b');
      const results = component.filteredProducts();
      expect(results.length).toBe(1);
      expect(results[0].nombre).toBe('Pan');
    });

    it('should filter by barcode', () => {
      component.searchTerm.set('77912345');
      const results = component.filteredProducts();
      expect(results.length).toBe(1);
      expect(results[0].codigoprod).toBe(100);
    });

    it('should return empty when no match', () => {
      component.searchTerm.set('zzzznoexist');
      expect(component.filteredProducts().length).toBe(0);
    });
  });

  // ── updateQty ─────────────────────────────────────────

  describe('updateQty()', () => {
    it('should update quantity of item at index', () => {
      component.cartItems.set([
        { idprodPresenta: 1, nombre: 'Item', presentacion: 'U', cantidad: 1, precio: 10 },
      ]);
      component.updateQty(0, 5);
      expect(component.cartItems()[0].cantidad).toBe(5);
    });

    it('should remove item when quantity is 0', () => {
      component.cartItems.set([
        { idprodPresenta: 1, nombre: 'Item', presentacion: 'U', cantidad: 1, precio: 10 },
      ]);
      component.updateQty(0, 0);
      expect(component.cartItems().length).toBe(0);
    });

    it('should remove item when quantity is negative', () => {
      component.cartItems.set([
        { idprodPresenta: 1, nombre: 'Item', presentacion: 'U', cantidad: 1, precio: 10 },
      ]);
      component.updateQty(0, -1);
      expect(component.cartItems().length).toBe(0);
    });
  });

  // ── removeItem ────────────────────────────────────────

  describe('removeItem()', () => {
    it('should remove item at index', () => {
      component.cartItems.set([
        { idprodPresenta: 1, nombre: 'A', presentacion: 'U', cantidad: 1, precio: 10 },
        { idprodPresenta: 2, nombre: 'B', presentacion: 'U', cantidad: 1, precio: 20 },
      ]);
      component.removeItem(0);
      expect(component.cartItems().length).toBe(1);
      expect(component.cartItems()[0].nombre).toBe('B');
    });
  });

  // ── addToCart ─────────────────────────────────────────

  describe('addToCart()', () => {
    it('should add a new item to cart', () => {
      (component as any).addToCart(mockProducto, mockPresentacion);
      expect(component.cartItems().length).toBe(1);
      expect(component.cartItems()[0].nombre).toBe('Leche');
      expect(component.cartItems()[0].cantidad).toBe(1);
      expect(component.cartItems()[0].precio).toBe(25.5);
    });

    it('should increment quantity when same presentation already in cart', () => {
      (component as any).addToCart(mockProducto, mockPresentacion);
      (component as any).addToCart(mockProducto, mockPresentacion);
      expect(component.cartItems().length).toBe(1);
      expect(component.cartItems()[0].cantidad).toBe(2);
    });

    it('should add separate entry for different presentation', () => {
      (component as any).addToCart(mockProducto, mockPresentacion);
      (component as any).addToCart(mockProducto, mockPresentacion2);
      expect(component.cartItems().length).toBe(2);
    });

    it('should fetch client-specific price when client is selected', () => {
      const mockCliente = { _id: 42, nombres: 'Test', idtipoCli: 5, estado: 1 };
      component.clientes = [mockCliente];
      component.selectedClientId = 42;
      precioService.getByPresentacion = vi.fn().mockReturnValue(
        of({ precio: 22, fuente: 'precio_especifico', tipoprecio: 'mayorista' }),
      );

      (component as any).addToCart(mockProducto, mockPresentacion);
      expect(precioService.getByPresentacion).toHaveBeenCalledWith(10, 5);
    });
  });

  // ── selectProduct ─────────────────────────────────────

  describe('selectProduct()', () => {
    it('should show snackbar when no active presentations', () => {
      const sinPres: Producto = { ...mockProducto, Presentaciones: [] };
      component.selectProduct(sinPres);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Este producto no tiene presentaciones activas',
        expect.any(String),
        expect.any(Object),
      );
    });

    it('should add to cart directly when only one presentation', () => {
      const unProducto: Producto = {
        ...mockProducto2,
        Presentaciones: [{ ...mockPresentacion, idprodPresenta: 30, precio_venta: 15 }],
      };
      component.selectProduct(unProducto);
      expect(component.cartItems().length).toBe(1);
    });

    it('should open dialog when multiple presentations', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(null) });
      component.selectProduct(mockProducto);
      expect(dialog.open).toHaveBeenCalled();
    });
  });

  // ── checkout ──────────────────────────────────────────

  describe('checkout()', () => {
    it('should do nothing when cart is empty', () => {
      component.checkout();
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('should open confirm dialog when cart has items', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(false) });
      component.cartItems.set([
        { idprodPresenta: 1, nombre: 'Item', presentacion: 'U', cantidad: 1, precio: 10 },
      ]);
      component.checkout();
      expect(dialog.open).toHaveBeenCalled();
    });

    it('should create venta when confirmed', () => {
      const afterClosed$ = new Subject<boolean>();
      dialog.open.mockReturnValue({ afterClosed: () => afterClosed$ });
      ventaService.create.mockReturnValue(of({ _id: 'new-venta-1' }));
      component.cartItems.set([
        { idprodPresenta: 1, nombre: 'Item', presentacion: 'U', cantidad: 2, precio: 10 },
      ]);
      component.selectedTipoPagoId = 3;

      component.checkout();
      afterClosed$.next(true);

      expect(ventaService.create).toHaveBeenCalledTimes(1);
      const payload = ventaService.create.mock.calls[0][0];
      expect(payload.total_orden).toBe(20);
      expect(payload.detalles.length).toBe(1);
      expect(payload.detalles[0]).toEqual({
        idprodPresenta: 1,
        cantidad: 2,
        precio: 10,
      });
      expect(payload.pago).toEqual({
        idtipopago: 3,
        importe: 20,
        estado: 'pagado',
      });
    });

    it('should show error snackbar on venta failure', () => {
      const afterClosed$ = new Subject<boolean>();
      dialog.open.mockReturnValue({ afterClosed: () => afterClosed$ });
      ventaService.create.mockReturnValue(of(undefined));

      component.cartItems.set([
        { idprodPresenta: 1, nombre: 'Item', presentacion: 'U', cantidad: 1, precio: 10 },
      ]);
      component.checkout();
      afterClosed$.next(true);
    });

    it('should not create venta when cancelled', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(false) });
      component.cartItems.set([
        { idprodPresenta: 1, nombre: 'Item', presentacion: 'U', cantidad: 1, precio: 10 },
      ]);
      component.checkout();
      expect(ventaService.create).not.toHaveBeenCalled();
    });
  });
});
