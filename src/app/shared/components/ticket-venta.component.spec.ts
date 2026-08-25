import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { TicketVentaComponent } from './ticket-venta.component';
import { AuthService } from '../../core/services/auth.service';
import { SucursalService } from '../../core/services/sucursal.service';
import type { Venta } from '../../core/interfaces/venta.interface';

function makeVenta(overrides: Partial<Venta> = {}): Venta {
  return {
    _id: 'venta-1',
    nombre: 'V-001',
    total: 150,
    fecha: '2026-06-25T10:30:00.000Z',
    Cliente: { _id: 1, nombres: 'Juan', apellidos: 'Pérez' },
    Detalles: [
      {
        idprodPresenta: 10,
        cantidad: 2,
        precio: 25.5,
        ProductoPresentacion: {
          idprodPresenta: 10,
          cantidad_base: 1,
          precio_venta: 25.5,
          Producto: { codigoprod: 100, nombre: 'Leche' },
          Presentacion: { idpresentacion: 1, nombre: 'Unidad' },
        },
      },
    ],
    Pago: { idtipopago: 3, importe: 150, estado: 'pagado' },
    ...overrides,
  };
}

describe('TicketVentaComponent', () => {
  let component: TicketVentaComponent;
  let fixture: ComponentFixture<TicketVentaComponent>;
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let authService: { getSession: ReturnType<typeof vi.fn> };
  let sucursalService: { getById: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    dialogRef = { close: vi.fn() };
    authService = { getSession: vi.fn().mockReturnValue({ token: 'x', user: { idsucursal: 1 } }) };
    sucursalService = { getById: vi.fn().mockReturnValue(of({ nombre: 'Sucursal Central' })) };
  });

  describe('with Sucursal in venta data', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [TicketVentaComponent],
        providers: [
          provideNoopAnimations(),
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: MAT_DIALOG_DATA, useValue: makeVenta({ Sucursal: { _id: 1, nombre: 'Sucursal Este' } }) },
          { provide: AuthService, useValue: authService },
          { provide: SucursalService, useValue: sucursalService },
        ],
      });
      fixture = TestBed.createComponent(TicketVentaComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should use sucursal name from venta.Sucursal', () => {
      expect(component.sucursalName()).toBe('Sucursal Este');
    });

    it('should NOT call sucursalService', () => {
      expect(sucursalService.getById).not.toHaveBeenCalled();
    });
  });

  describe('without Sucursal in venta data', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [TicketVentaComponent],
        providers: [
          provideNoopAnimations(),
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: MAT_DIALOG_DATA, useValue: makeVenta() },
          { provide: AuthService, useValue: authService },
          { provide: SucursalService, useValue: sucursalService },
        ],
      });
      fixture = TestBed.createComponent(TicketVentaComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should fallback to sucursal from service', () => {
      expect(sucursalService.getById).toHaveBeenCalledWith(1);
    });

    it('should set sucursalName from service response', () => {
      expect(component.sucursalName()).toBe('Sucursal Central');
    });
  });

  // ── Actions ───────────────────────────────────────────

  describe('actions', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [TicketVentaComponent],
        providers: [
          provideNoopAnimations(),
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: MAT_DIALOG_DATA, useValue: makeVenta() },
          { provide: AuthService, useValue: authService },
          { provide: SucursalService, useValue: sucursalService },
        ],
      });
      fixture = TestBed.createComponent(TicketVentaComponent);
      component = fixture.componentInstance;
    });

    it('should close dialog on cerrar()', () => {
      component.cerrar();
      expect(dialogRef.close).toHaveBeenCalled();
    });

    it('should render venta nombre in template', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('V-001');
    });

    it('should render Cliente name', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Juan');
    });

    it('should render total', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('150');
    });

    it('should render detalle producto name', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Leche');
    });
  });

  describe('Consumidor Final (no cliente)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [TicketVentaComponent],
        providers: [
          provideNoopAnimations(),
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: MAT_DIALOG_DATA, useValue: makeVenta({ Cliente: undefined }) },
          { provide: AuthService, useValue: authService },
          { provide: SucursalService, useValue: sucursalService },
        ],
      });
      fixture = TestBed.createComponent(TicketVentaComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should show Consumidor Final when no Cliente', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Consumidor Final');
    });

    it('should hide Cliente apellidos when no Cliente', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('Pérez');
    });
  });
});
