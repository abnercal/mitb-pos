import { TestBed, type ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VentaFormComponent } from './venta-form.component';
import { VentaService } from '../../core/services/venta.service';
import { ClienteService } from '../../core/services/cliente.service';
import { ProductoService } from '../../core/services/producto.service';
import { AuthService } from '../../core/services/auth.service';
import { PrecioService } from '../../core/services/precio.service';
import type { Producto } from '../../core/interfaces/producto.interface';
import type { ProductoPresentacion } from '../../core/interfaces/producto-presentacion.interface';

const mockPres: ProductoPresentacion = {
  idprodPresenta: 10,
  codigoprod: 100,
  idpresentacion: 1,
  cantidad_base: 1,
  precio_venta: 25.5,
  estado: 1,
  Presentacion: { nombre: 'Unidad' },
};

const mockPres2: ProductoPresentacion = {
  idprodPresenta: 20,
  codigoprod: 200,
  idpresentacion: 2,
  cantidad_base: 12,
  precio_venta: 180,
  estado: 1,
  Presentacion: { nombre: 'Caja' },
};

const mockProducto: Producto = {
  codigoprod: 100,
  nombre: 'Leche',
  estado: 1,
  Marca: { nombre: 'Marca A' },
  Presentaciones: [mockPres, mockPres2],
};

describe('VentaFormComponent', () => {
  let component: VentaFormComponent;
  let fixture: ComponentFixture<VentaFormComponent>;
  let ventaService: { create: ReturnType<typeof vi.fn>; getNextCode: ReturnType<typeof vi.fn> };
  let productoService: { getAllList: ReturnType<typeof vi.fn> };
  let clienteService: { getAllList: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn>; afterClosed: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let authService: { getSession: ReturnType<typeof vi.fn> };
  let precioService: { getByPresentacion: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    ventaService = {
      create: vi.fn().mockReturnValue(of({ _id: 'new-venta' })),
      getNextCode: vi.fn().mockReturnValue(of({ codigo: 'V-001' })),
    };
    productoService = { getAllList: vi.fn().mockReturnValue(of([mockProducto])) };
    clienteService = { getAllList: vi.fn().mockReturnValue(of([])) };
    dialogRef = {
      close: vi.fn(),
      afterClosed: vi.fn().mockReturnValue(of(undefined)),
    };
    snackBar = { open: vi.fn() };
    authService = {
      getSession: vi.fn().mockReturnValue({ token: 'x', user: { id: 1, idsucursal: 1 } }),
    };
    precioService = {
      getByPresentacion: vi.fn().mockReturnValue(of({ precio: 0, fuente: 'precio_venta' })),
    };

    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [VentaFormComponent],
      providers: [
        provideNoopAnimations(),
        { provide: VentaService, useValue: ventaService },
        { provide: ClienteService, useValue: clienteService },
        { provide: ProductoService, useValue: productoService },
        { provide: AuthService, useValue: authService },
        { provide: PrecioService, useValue: precioService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    });

    TestBed.overrideProvider(MatSnackBar, { useValue: snackBar });
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(VentaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  // ── Creación ──────────────────────────────────────────

  describe('creation', () => {
    it('should create', () => {
      createComponent();
      expect(component).toBeTruthy();
    });

    it('should load clientes and productos on init', () => {
      createComponent();
      expect(clienteService.getAllList).toHaveBeenCalledTimes(1);
      expect(productoService.getAllList).toHaveBeenCalledTimes(1);
    });

    it('should fetch next code on init', () => {
      createComponent();
      expect(ventaService.getNextCode).toHaveBeenCalledTimes(1);
      expect(component.nextCode()).toBe('V-001');
    });
  });

  // ── total computed ────────────────────────────────────

  describe('total computed', () => {
    it('should be 0 when no detalles', () => {
      createComponent();
      expect(component.total()).toBe(0);
    });

    it('should sum cantidad * precio for each item', () => {
      createComponent();
      component.detalles.set([
        { idprodPresenta: 1, nombre: 'Item A', presentacion: 'U', cantidad: 2, precio: 10 },
        { idprodPresenta: 2, nombre: 'Item B', presentacion: 'C', cantidad: 1, precio: 25 },
      ]);
      expect(component.total()).toBe(45);
    });
  });

  // ── presOptions computed ──────────────────────────────

  describe('presOptions computed', () => {
    it('should flatten products into presentation options', () => {
      createComponent();

      expect(component.presOptions().length).toBe(2);
      expect(component.presOptions()[0].nombre).toBe('Leche');
      expect(component.presOptions()[0].presentacion).toBe('Unidad');
      expect(component.presOptions()[0].precioVenta).toBe(25.5);
      expect(component.presOptions()[1].presentacion).toBe('Caja');
      expect(component.presOptions()[1].precioVenta).toBe(180);
    });

    it('should filter out presentations with estado 0', () => {
      const inactivePres: ProductoPresentacion = {
        ...mockPres,
        idprodPresenta: 30,
        estado: 0,
      };
      const prod: Producto = {
        ...mockProducto,
        Presentaciones: [mockPres, inactivePres],
      };
      component = TestBed.createComponent(VentaFormComponent).componentInstance;
      component.productos.set([prod]);

      const options = component.presOptions();
      expect(options.length).toBe(1); // only the active one
    });
  });

  // ── addDetalle ────────────────────────────────────────

  describe('addDetalle()', () => {
    it('should add a detail and reset form fields', () => {
      createComponent();
      component.selectedPres = {
        idprodPresenta: 10,
        label: 'Leche — Unidad (Q 25.50)',
        nombre: 'Leche',
        presentacion: 'Unidad',
        precioVenta: 25.5,
      };
      component.newCantidad = 3;
      component.newPrecio = 25.5;

      component.addDetalle();

      expect(component.detalles().length).toBe(1);
      expect(component.detalles()[0]).toEqual({
        idprodPresenta: 10,
        nombre: 'Leche',
        presentacion: 'Unidad',
        cantidad: 3,
        precio: 25.5,
      });
      expect(component.selectedPres).toBeNull();
      expect(component.newCantidad).toBe(1);
      expect(component.newPrecio).toBe(0);
    });

    it('should not add when no product selected', () => {
      createComponent();
      component.selectedPres = null;
      component.addDetalle();
      expect(component.detalles().length).toBe(0);
    });
  });

  // ── removeDetalle ─────────────────────────────────────

  describe('removeDetalle()', () => {
    it('should remove detail at index', () => {
      createComponent();
      component.detalles.set([
        { idprodPresenta: 1, nombre: 'A', presentacion: 'U', cantidad: 1, precio: 10 },
        { idprodPresenta: 2, nombre: 'B', presentacion: 'U', cantidad: 1, precio: 20 },
      ]);
      component.removeDetalle(0);
      expect(component.detalles().length).toBe(1);
      expect(component.detalles()[0].nombre).toBe('B');
    });
  });

  // ── submit ────────────────────────────────────────────

  describe('submit()', () => {
    it('should create venta with correct payload', () => {
      createComponent();
      component.nextCode.set('V-001');
      component.detalles.set([
        { idprodPresenta: 10, nombre: 'Leche', presentacion: 'Unidad', cantidad: 2, precio: 25.5 },
      ]);

      component.submit();

      expect(ventaService.create).toHaveBeenCalledTimes(1);
      const payload = ventaService.create.mock.calls[0][0];
      // Sin cliente elegido y sin nombre escrito a mano: no se manda `nombre`
      // — el backend resuelve solo contra "Consumidor Final".
      expect(payload.nombre).toBeUndefined();
      expect(payload.total).toBe(51);
      expect(payload.detalles.length).toBe(1);
      expect(payload.pago.importe).toBe(51);
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should not submit without nextCode', () => {
      createComponent();
      component.nextCode.set(null);
      component.detalles.set([
        { idprodPresenta: 10, nombre: 'Leche', presentacion: 'U', cantidad: 1, precio: 10 },
      ]);
      component.submit();
      expect(ventaService.create).not.toHaveBeenCalled();
    });

    it('should not submit without detalles', () => {
      createComponent();
      component.submit();
      expect(ventaService.create).not.toHaveBeenCalled();
    });

    it('should show error snackbar when no session', () => {
      createComponent();
      authService.getSession.mockReturnValue(null);
      component.nextCode.set('V-001');
      component.detalles.set([
        { idprodPresenta: 10, nombre: 'Leche', presentacion: 'U', cantidad: 1, precio: 10 },
      ]);
      component.submit();
      expect(snackBar.open).toHaveBeenCalledWith(
        'No hay sesión activa',
        expect.any(String),
        expect.any(Object),
      );
    });
  });

  // ── clearForm ─────────────────────────────────────────

  describe('clearForm()', () => {
    it('should clear detalles, form, and localStorage', () => {
      createComponent();
      localStorage.setItem('pending_venta_form', '{}');
      component.detalles.set([
        { idprodPresenta: 1, nombre: 'A', presentacion: 'U', cantidad: 1, precio: 10 },
      ]);
      component.form.patchValue({ idcliente: 5 });

      component.clearForm();

      expect(component.detalles().length).toBe(0);
      expect(component.form.get('idcliente')?.value).toBeNull();
      expect(localStorage.getItem('pending_venta_form')).toBeNull();
    });
  });
});
