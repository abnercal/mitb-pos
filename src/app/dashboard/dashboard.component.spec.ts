import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import DashboardComponent from './dashboard.component';
import { VentaService } from '../core/services/venta.service';
import { ProductoService } from '../core/services/producto.service';
import { ProveedorService } from '../core/services/proveedor.service';
import { ClienteService } from '../core/services/cliente.service';
import { AppEventsService } from '../core/services/app-events.service';

function mockService() {
  return { getAllList: vi.fn().mockReturnValue(of([])) };
}

function makeVenta(overrides: Record<string, any> = {}): any {
  return {
    _id: 'v1',
    nombre: 'V-001',
    total: 100,
    fecha: '2026-06-24',
    Detalles: [],
    ...overrides,
  };
}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let ventaService: ReturnType<typeof mockService>;
  let productoService: ReturnType<typeof mockService>;
  let proveedorService: ReturnType<typeof mockService>;
  let clienteService: ReturnType<typeof mockService>;
  let appEvents: { saleCompleted$: Subject<void>; notifySaleCompleted: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    productoService = mockService();
    proveedorService = mockService();
    clienteService = mockService();
    ventaService = mockService();
    appEvents = { saleCompleted$: new Subject<void>(), notifySaleCompleted: vi.fn() };

    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: VentaService, useValue: ventaService },
        { provide: ProductoService, useValue: productoService },
        { provide: ProveedorService, useValue: proveedorService },
        { provide: ClienteService, useValue: clienteService },
        { provide: AppEventsService, useValue: appEvents },
      ],
    });

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  // ── Creación ──────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── loadData ──────────────────────────────────────────

  describe('loadData()', () => {
    it('should load data from 4 services on init', () => {
      fixture.detectChanges();
      expect(productoService.getAllList).toHaveBeenCalledTimes(1);
      expect(clienteService.getAllList).toHaveBeenCalledTimes(1);
      expect(proveedorService.getAllList).toHaveBeenCalledTimes(1);
      expect(ventaService.getAllList).toHaveBeenCalledTimes(1);
    });

    it('should set totalProductos, totalClientes, totalProveedores', () => {
      productoService.getAllList.mockReturnValue(of([{}, {}, {}]));
      clienteService.getAllList.mockReturnValue(of([{}, {}]));
      proveedorService.getAllList.mockReturnValue(of([{}]));

      fixture.detectChanges();

      expect(component.totalProductos()).toBe(3);
      expect(component.totalClientes()).toBe(2);
      expect(component.totalProveedores()).toBe(1);
    });

    it('should compute todaySales from ventas with matching date', () => {
      const ventas = [
        makeVenta({ _id: 'v1', total: 50, fecha: '2026-06-24' }),
        makeVenta({ _id: 'v2', total: 30, fecha: '2026-06-24' }),
        makeVenta({ _id: 'v3', total: 20, fecha: '2024-01-01' }),
      ];
      ventaService.getAllList.mockReturnValue(of(ventas));

      fixture.detectChanges();

      expect(component.todaySales()).toBe(80);
    });

    it('should ignore ventas without date', () => {
      ventaService.getAllList.mockReturnValue(of([makeVenta({ fecha: undefined as any })]));

      fixture.detectChanges();

      expect(component.todaySales()).toBe(0);
    });

    it('should set recentSales to first 10 ventas', () => {
      const ventas = Array.from({ length: 15 }, (_, i) => makeVenta({ _id: `v${i}` }));
      ventaService.getAllList.mockReturnValue(of(ventas));

      fixture.detectChanges();

      expect(component.recentSales().length).toBe(10);
    });

    it('should set loading false after load', () => {
      fixture.detectChanges();
      expect(component.loading()).toBe(false);
    });
  });

  // ── Auto-refresh ──────────────────────────────────────

  describe('auto-refresh', () => {
    it('should reload on saleCompleted event', () => {
      fixture.detectChanges();
      expect(productoService.getAllList).toHaveBeenCalledTimes(1);

      appEvents.saleCompleted$.next();

      expect(productoService.getAllList).toHaveBeenCalledTimes(2);
    });
  });
});
