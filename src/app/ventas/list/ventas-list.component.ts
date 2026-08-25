import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BaseListComponent } from '../../shared/components/base-list/base-list';
import { VentaService, RegistrarPagoBody } from '../../core/services/venta.service';
import { Venta } from '../../core/interfaces/venta.interface';
import { VentaFormComponent } from '../form/venta-form.component';
import { DetalleDialog, DetalleItem } from '../../shared/components/detalle-dialog.component';
import { TicketVentaComponent } from '../../shared/components/ticket-venta.component';
import { ConfirmDeleteDialog } from '../../shared/components/confirm-delete-dialog';
import { RegistrarPagoDialog } from '../dialogs/registrar-pago-dialog';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** Nombres fijos de Estado devueltos por la API (ver Estado.nombre en venta.interface.ts). */
type EstadoTab = 'Todas' | 'Cotizacion' | 'Confirmada' | 'Entregada' | 'Anulada';

@Component({
  selector: 'app-ventas-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatDialogModule, MatSnackBarModule, MatTooltipModule, MatPaginatorModule,
  ],
  template: `
    <div class="page-header">
      <h1>{{ title }}</h1>
      <button mat-raised-button color="primary" (click)="openCreate()">
        <mat-icon>point_of_sale</mat-icon> Nueva venta
      </button>
    </div>

    <mat-card>
      <mat-card-header>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar venta</mat-label>
          <input matInput [(ngModel)]="searchTerm" placeholder="Cliente o referencia" (input)="onSearchChange()">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </mat-card-header>
      <mat-card-content>
        <!--
          Filtro por estado: CLIENT-SIDE, sobre las filas ya cargadas/paginadas.
          El backend (getVentasFtr) hoy solo filtra por fecha o texto libre (nombre/Cliente.nombres),
          no por estado — ver controllers/ventas/feature.js. Esto significa que el filtro solo
          afecta lo que ya está en la página actual: si hay más "Cotizaciones" en otras páginas,
          no aparecerán acá hasta que se pagine hasta ellas. Un parámetro server-side
          (idestado/nombre) sería el follow-up correcto si el volumen de datos crece.
        -->
        <mat-chip-listbox
          class="estado-tabs"
          aria-label="Filtrar por estado"
          [value]="selectedTab()"
          (change)="onTabChange($event.value)"
        >
          @for (tab of estadoTabs; track tab) {
            <mat-chip-option [value]="tab">{{ tabLabels[tab] }}</mat-chip-option>
          }
        </mat-chip-listbox>

        <div class="table-responsive">
        <table mat-table [dataSource]="filteredData()" class="full-table">
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Referencia</th>
            <td mat-cell *matCellDef="let item"><strong>{{ item.referencia || item.nombre }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="cliente">
            <th mat-header-cell *matHeaderCellDef>Cliente</th>
            <td mat-cell *matCellDef="let item">{{ item.nombre || item.Cliente?.nombres || 'Consumidor Final' }}</td>
          </ng-container>
          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let item">{{ (item.fecha || item.createdAt) | date:'shortDate' }}</td>
          </ng-container>
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let item"><strong>Q {{ (item.total || 0) | number:'.2' }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let item">
              <mat-chip [class]="estadoChipClass(item)" highlighted>
                {{ estadoLabel(item) }}
              </mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="saldo">
            <th mat-header-cell *matHeaderCellDef>Saldo pendiente</th>
            <td mat-cell *matCellDef="let item">
              @if (item.Estado?.nombre === 'Cotizacion') {
                <span class="muted">N/A</span>
              } @else {
                <strong>Q {{ (item.saldoPendiente ?? 0) | number:'.2' }}</strong>
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="ticket">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let item">
              <button mat-icon-button (click)="openTicket(item)" matTooltip="Ticket"><mat-icon>receipt</mat-icon></button>
            </td>
          </ng-container>
          <ng-container matColumnDef="detalle">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let item">
              <button mat-icon-button (click)="openDetalle(item)" matTooltip="Ver detalle"><mat-icon>visibility</mat-icon></button>
            </td>
          </ng-container>
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let item">
              @if (item.Estado?.nombre === 'Cotizacion') {
                <button mat-icon-button color="primary" (click)="convertir(item)" matTooltip="Convertir a venta">
                  <mat-icon>swap_horiz</mat-icon>
                </button>
              }
              @if (item.Estado?.nombre === 'Confirmada' || item.Estado?.nombre === 'Entregada') {
                <button mat-icon-button color="primary" (click)="registrarAbono(item)" matTooltip="Registrar abono">
                  <mat-icon>payments</mat-icon>
                </button>
              }
              @if (item.Estado?.nombre === 'Confirmada' && item.fecha_conversion) {
                <button mat-icon-button color="primary" (click)="marcarEntregada(item)" matTooltip="Marcar como entregada">
                  <mat-icon>local_shipping</mat-icon>
                </button>
              }
              @if (item.Estado?.nombre !== 'Anulada') {
                <button mat-icon-button color="warn" (click)="anular(item)" matTooltip="Anular"><mat-icon>cancel</mat-icon></button>
              }
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell" [attr.colspan]="columns.length">
              <div class="empty-state"><mat-icon>point_of_sale</mat-icon>
                <p>{{ searchTerm() ? 'Sin resultados' : 'No hay ventas registradas' }}</p>
              </div>
            </td>
          </tr>
        </table>
        </div>
        <mat-paginator [length]="totalItems()" [pageSize]="pageSize()"
          [pageSizeOptions]="[5, 10, 25, 50]" (page)="onPage($event)">
        </mat-paginator>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .search-field { width: 100%; max-width: 400px; margin: 16px 0 0 16px; }
    .estado-tabs { margin: 16px 0 0 16px; }
    .full-table { width: 100%; }
    .muted { color: var(--mat-sys-on-surface-variant); }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px; color: var(--mat-sys-on-surface-variant); }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
    .chip-primary { --mdc-chip-elevated-container-color: var(--mat-sys-primary-container); --mdc-chip-label-text-color: var(--mat-sys-on-primary-container); }
    .chip-warn { --mdc-chip-elevated-container-color: var(--mat-sys-error-container); --mdc-chip-label-text-color: var(--mat-sys-on-error-container); }
    .chip-success { --mdc-chip-elevated-container-color: #d4edda; --mdc-chip-label-text-color: #155724; }
    .chip-info { --mdc-chip-elevated-container-color: var(--mat-sys-secondary-container); --mdc-chip-label-text-color: var(--mat-sys-on-secondary-container); }
    .chip-neutral { --mdc-chip-elevated-container-color: var(--mat-sys-surface-container-high); --mdc-chip-label-text-color: var(--mat-sys-on-surface-variant); }
  `],
})
export default class VentasListComponent extends BaseListComponent<Venta> {
  override title = 'Ventas';
  override entityName = 'ventas';
  override formComponent = VentaFormComponent;
  override dialogWidth = '750px';
  override columns = ['nombre', 'cliente', 'fecha', 'total', 'estado', 'saldo', 'ticket', 'detalle', 'acciones'];

  readonly searchTerm = signal('');

  readonly estadoTabs: EstadoTab[] = ['Todas', 'Cotizacion', 'Confirmada', 'Entregada', 'Anulada'];
  readonly tabLabels: Record<EstadoTab, string> = {
    Todas: 'Todas',
    Cotizacion: 'Cotizaciones',
    Confirmada: 'Confirmadas',
    Entregada: 'Entregadas',
    Anulada: 'Anuladas',
  };
  readonly selectedTab = signal<EstadoTab>('Todas');

  /**
   * Filtro client-side sobre `data()` (la página ya cargada). Ver comentario en el template
   * sobre la limitación: no filtra sobre todo el dataset, solo sobre la página actual.
   */
  readonly filteredData = computed(() => {
    const tab = this.selectedTab();
    if (tab === 'Todas') return this.data();
    return this.data().filter((item) => item.Estado?.nombre === tab);
  });

  private readonly ventaService = inject(VentaService);
  private readonly dialog2 = inject(MatDialog);
  private readonly snackBar2 = inject(MatSnackBar);
  private readonly router = inject(Router);

  /**
   * Ventas usa una página completa (ruteada) para crear en vez del modal de
   * dos viñetas que usaba antes — mismo criterio que Productos (ver
   * productos-list.component.ts): el catálogo + panel de venta no entran
   * cómodos en un dialog de ancho fijo.
   */
  override openCreate(): void {
    this.router.navigate(['/ventas/nueva']);
  }

  protected override buildParams(): { page: number; limit: number; search: string } {
    return { page: this.pageIndex() + 1, limit: this.pageSize(), search: this.searchTerm() };
  }

  protected override loadService(page: number, limit: number, search?: string): Observable<{ data: Venta[]; total: number }> {
    return this.ventaService.getAll(page, limit, search);
  }

  protected override deleteService(): Observable<void> {
    return of(undefined);
  }

  protected override getId(item: Venta): number | string { return item._id!; }
  protected override getDisplayName(item: Venta): string { return item.nombre; }

  onTabChange(tab: EstadoTab): void {
    this.selectedTab.set(tab);
  }

  estadoLabel(item: Venta): string {
    switch (item.Estado?.nombre) {
      case 'Cotizacion': return 'Cotización';
      case 'Confirmada': return 'Confirmada';
      case 'Entregada': return 'Entregada';
      case 'Anulada': return 'Anulada';
      default: return '—';
    }
  }

  estadoChipClass(item: Venta): string {
    switch (item.Estado?.nombre) {
      case 'Cotizacion': return 'chip-info';
      case 'Confirmada': return 'chip-primary';
      case 'Entregada': return 'chip-success';
      case 'Anulada': return 'chip-warn';
      default: return 'chip-neutral';
    }
  }

  openTicket(item: Venta): void {
    this.dialog2.open(TicketVentaComponent, { width: '520px', data: item, autoFocus: false });
  }

  openDetalle(item: Venta): void {
    const items: DetalleItem[] = (item.Detalles || []).map(d => ({
      producto: (d.ProductoPresentacion?.Producto?.nombre || 'Producto') +
                (d.ProductoPresentacion?.Presentacion?.nombre ? ` - ${d.ProductoPresentacion.Presentacion.nombre}` : ''),
      cantidad: d.cantidad,
      precioUnitario: Number(d.precio),
      subtotal: Number(d.cantidad) * Number(d.precio),
    }));
    this.dialog2.open(DetalleDialog, {
      width: '600px',
      data: { title: `Detalle: ${item.nombre}`, items, unitLabel: 'Precio' },
    });
  }

  anular(item: Venta): void {
    const ref = this.dialog2.open(ConfirmDeleteDialog, {
      width: '400px',
      data: { name: item.nombre },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.ventaService.anular(item._id!).subscribe({
        next: () => {
          this.snackBar2.open('Venta anulada', 'Cerrar', { duration: 2000 });
          this.load();
        },
        error: () => {
          this.snackBar2.open('Error al anular venta', 'Cerrar', { duration: 3000 });
        },
      });
    });
  }

  convertir(item: Venta): void {
    this.ventaService.convertir(item._id!).pipe(catchError(() => {
      this.snackBar2.open('Error al convertir cotización', 'Cerrar', { duration: 3000 });
      return of(undefined);
    })).subscribe((result) => {
      if (result === undefined) return;
      this.snackBar2.open('Cotización convertida a venta', 'Cerrar', { duration: 2000 });
      this.load();
    });
  }

  marcarEntregada(item: Venta): void {
    this.ventaService.marcarEntregada(item._id!).subscribe({
      next: () => {
        this.snackBar2.open('Venta marcada como entregada', 'Cerrar', { duration: 2000 });
        this.load();
      },
      error: () => {
        this.snackBar2.open('Error al marcar venta como entregada', 'Cerrar', { duration: 3000 });
      },
    });
  }

  registrarAbono(item: Venta): void {
    const ref = this.dialog2.open(RegistrarPagoDialog, { width: '420px', data: { venta: item } });
    ref.afterClosed().subscribe((body: RegistrarPagoBody | undefined) => {
      if (!body) return;
      this.ventaService.registrarPago(item._id!, body).pipe(catchError(() => {
        this.snackBar2.open('Error al registrar abono', 'Cerrar', { duration: 3000 });
        return of(undefined);
      })).subscribe((result) => {
        if (result === undefined) return;
        this.snackBar2.open('Abono registrado', 'Cerrar', { duration: 2000 });
        this.load();
      });
    });
  }
}
