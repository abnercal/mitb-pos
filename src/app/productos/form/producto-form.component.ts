import { Component, OnInit, DestroyRef, inject, signal, computed } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormArray,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { ProductoService } from '../../core/services/producto.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { MarcaService } from '../../core/services/marca.service';
import { PresentacionService } from '../../core/services/presentacion.service';
import { UnidadService } from '../../core/services/unidad.service';
import { PrecioService } from '../../core/services/precio.service';
import { TipoClienteService } from '../../core/services/tipo-cliente.service';
import { Precio } from '../../core/interfaces/precio.interface';
import { Producto } from '../../core/interfaces/producto.interface';
import {
  PresentacionForm,
  ProductoPresentacion,
} from '../../core/interfaces/producto-presentacion.interface';
import { Categoria } from '../../core/interfaces/categoria.interface';
import { Marca } from '../../core/interfaces/marca.interface';
import { Presentacion } from '../../core/interfaces/presentacion.interface';
import { Unidad } from '../../core/interfaces/unidad.interface';
import { TipoClie } from '../../core/interfaces/cliente.interface';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatTooltipModule,
    MatCardModule,
  ],
  templateUrl: './producto-form.component.html',
  styles: [
    `
      .page-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
      }
      .page-header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 500;
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--mat-sys-outline-variant);
      }
      .tab-content {
        padding: 20px 4px 4px;
      }
      .full-width {
        width: 100%;
        margin-bottom: 16px;
      }
      .form-row {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .flex-1 {
        flex: 1;
      }
      .toggle-row {
        margin: 16px 0;
      }
      .section-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 20px 0 12px;
        font-size: 16px;
        font-weight: 500;
      }
      .tab-content > .section-title:first-child {
        margin-top: 0;
      }
      .pres-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 12px;
      }
      .pres-row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1.5fr auto;
        gap: 8px;
        align-items: start;
      }
      @media (max-width: 599px) {
        .pres-row {
          grid-template-columns: 1fr 1fr;
        }
        .pres-select {
          grid-column: 1 / -1;
        }
        .pres-barcode {
          grid-column: 1;
        }
        .pres-price {
          grid-column: 2;
        }
        .pres-qty {
          grid-column: 1;
        }
        .pres-row button[type='button'] {
          grid-column: 2;
          justify-self: end;
          align-self: start;
          margin-top: 4px;
        }
      }
      .pres-empty {
        text-align: center;
        padding: 20px;
        background: var(--mat-sys-surface-container);
        border-radius: 8px;
        color: var(--mat-sys-on-surface-variant);
        font-size: 14px;
      }
      .precios-table {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 8px 0;
      }
      .precios-header {
        display: flex;
        gap: 8px;
        font-size: 12px;
        font-weight: 600;
        color: var(--mat-sys-on-surface-variant);
        text-transform: uppercase;
        padding: 0 4px;
        flex-wrap: wrap;
      }
      .precios-header span {
        min-width: 100px;
      }
      .precios-header span:nth-child(1) {
        flex: 2;
        min-width: 130px;
      }
      .precios-header span:nth-child(2) {
        flex: 2;
        min-width: 140px;
      }
      .precios-header span:nth-child(3) {
        flex: 1;
        min-width: 100px;
      }
      .precios-header span:nth-child(4) {
        flex: 2;
        min-width: 200px;
      }
      .precios-header span:nth-child(5) {
        width: 40px;
      }
      .precios-row {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .precios-row mat-form-field:nth-child(1) {
        flex: 2;
        min-width: 130px;
      }
      .precios-row mat-form-field:nth-child(2) {
        flex: 2;
        min-width: 140px;
      }
      .precios-row mat-form-field:nth-child(3) {
        flex: 1;
        min-width: 100px;
      }
      .vigencia-fields {
        flex: 2;
        display: flex;
        gap: 4px;
        min-width: 200px;
      }
      .vigencia-fields mat-form-field {
        flex: 1;
      }
      .precio-inactivo {
        opacity: 0.6;
      }
      .precio-estado-badge {
        align-self: center;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        background: #e8f5e9;
        color: #2e7d32;
      }
      .precio-estado-badge.inactivo {
        background: var(--mat-sys-error-container);
        color: var(--mat-sys-error);
      }
      .empty-precios {
        text-align: center;
        padding: 16px;
        background: var(--mat-sys-surface-container-low);
        border-radius: 8px;
        color: var(--mat-sys-on-surface-variant);
        font-size: 13px;
        border: 1px dashed var(--mat-sys-outline-variant);
        margin: 8px 0;
      }
    `,
  ],
})
export default class ProductoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly marcaService = inject(MarcaService);
  private readonly presentacionService = inject(PresentacionService);
  private readonly unidadService = inject(UnidadService);
  private readonly precioService = inject(PrecioService);
  private readonly tipoClienteService = inject(TipoClienteService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Producto en edición (cargado desde el :id de la ruta), o null en modo creación */
  protected data: Producto | null = null;

  categorias: Categoria[] = [];
  marcas: Marca[] = [];
  todasPresentaciones: Presentacion[] = [];
  unidades: Unidad[] = [];
  tiposCliente: TipoClie[] = [];

  readonly precios = signal<Precio[]>([]);
  /** Precios ordenados: activos primero, luego por más reciente. El listado
   * puede acumular muchos precios inactivos (soft-delete) con el tiempo. */
  readonly preciosOrdenados = computed(() =>
    [...this.precios()].sort((a, b) => {
      const estadoA = a.estado ?? 1;
      const estadoB = b.estado ?? 1;
      if (estadoA !== estadoB) return estadoB - estadoA;
      return (b.idprecios ?? 0) - (a.idprecios ?? 0);
    }),
  );
  /** Presentaciones disponibles (del producto actual o recién creado) */
  presentacionesProducto: { idprodPresenta?: number; Presentacion?: { nombre: string } }[] = [];
  private preciosRemovidos: number[] = [];
  private readonly formVersion = signal(0);

  /** Presentaciones disponibles para el select de precios (señal computada, evita loops) */
  readonly presOptions = computed(() => {
    this.formVersion(); // dependencia para recalcular
    if (this.presentacionesProducto.length) return this.presentacionesProducto;

    return this.presentacionesArray.controls
      .map((c, i) => {
        const idpres = c.get('idpresentacion')?.value;
        if (!idpres) return null;
        const pres = this.todasPresentaciones.find((p) => p._id === idpres);
        return {
          idprodPresenta: -(i + 1),
          Presentacion: pres ? { nombre: pres.nombre } : { nombre: `Presentación ${i + 1}` },
        };
      })
      .filter((p): p is { idprodPresenta: number; Presentacion: { nombre: string } } => p != null);
  });

  readonly form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    idcategoria: [null as number | null],
    idmarca: [null as number | null],
    idunidad: [null as number | null],
    stock_minimo: [0],
    estado: [1],
    controla_vencimiento: [false],
    presentaciones: this.fb.array([]),
  });

  get presentacionesArray(): FormArray {
    return this.form.get('presentaciones') as FormArray;
  }

  ngOnInit(): void {
    this.categoriaService.getAllList().subscribe((r) => (this.categorias = r));
    this.marcaService.getAllList().subscribe((r) => (this.marcas = r));
    this.presentacionService.getAllList().subscribe((r) => (this.todasPresentaciones = r));
    this.unidadService.getAllList().subscribe((r) => (this.unidades = r));

    // Cargar tipos de cliente
    this.tipoClienteService.getAll().subscribe({
      next: (r) => (this.tiposCliente = r),
      error: () =>
        this.snackBar.open('Error al cargar tipos de cliente', 'Cerrar', { duration: 3000 }),
    });

    // Recalcular presOptions cada vez que cambien las presentaciones del form
    this.presentacionesArray.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formVersion.update((v) => v + 1));

    // Modo edición: el :id viene de la ruta (antes llegaba vía MAT_DIALOG_DATA)
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.service.getById(idParam).subscribe({
        next: (producto) => this.loadProducto(producto),
        error: () => {
          this.snackBar.open('Error al cargar el producto', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/productos']);
        },
      });
    }
  }

  /** Puebla el form y el estado del componente una vez cargado el producto a editar */
  private loadProducto(producto: Producto): void {
    this.data = producto;

    this.form.patchValue({
      nombre: producto.nombre ?? '',
      descripcion: producto.descripcion ?? '',
      idcategoria: producto.idcategoria ?? null,
      idmarca: producto.idmarca ?? null,
      idunidad: producto.idunidad ?? null,
      stock_minimo: producto.stock_minimo ?? 0,
      estado: producto.estado ?? 1,
      controla_vencimiento: producto.controla_vencimiento ?? false,
    });

    // Cargar presentaciones existentes
    if (producto.Presentaciones?.length) {
      for (const pp of producto.Presentaciones) {
        this.presentacionesArray.push(
          this.buildPresGroup({
            idpresentacion: pp.idpresentacion,
            cantidad_base: pp.cantidad_base,
            precio_venta: pp.precio_venta,
            codigo_barras: pp.codigo_barras ?? '',
          }),
        );
      }
      this.presentacionesProducto = producto.Presentaciones.filter((pp) => pp.estado !== 0);
    }

    // Cargar precios existentes
    if (producto.codigoprod) {
      this.precioService.getByProducto(producto.codigoprod).subscribe({
        next: (r) => this.precios.set(r),
        error: () => this.precios.set([]),
      });
    }
  }

  /** Devuelve las presentaciones que NO están ya seleccionadas en otra fila */
  presentacionesDisponibles(index: number): Presentacion[] {
    const selectedIds = this.presentacionesArray.controls
      .map((c, i) => (i !== index ? c.get('idpresentacion')?.value : null))
      .filter((v) => v != null);
    return this.todasPresentaciones.filter((p) => !selectedIds.includes(p._id));
  }

  addPresentacion(): void {
    this.presentacionesArray.push(this.buildPresGroup({}));
  }

  removePresentacion(index: number): void {
    this.presentacionesArray.removeAt(index);
  }

  addPrecio(): void {
    const primeraPres = this.presOptions()[0];
    this.precios.update((p) => [
      ...p,
      {
        idprodPresenta: primeraPres?.idprodPresenta ?? 0,
        idtipoCli: this.tiposCliente[0]?.idtipoCli ?? 0,
        precio: 0,
        // El precio real se controla por idtipoCli (mayorista/minorista, etc).
        // 'tipoprecio' quedó como columna legacy en el backend, no participa
        // en obtenerPrecioCorrecto() y ya no se expone en este formulario.
        fechaefecto: undefined,
        fechafin: undefined,
      },
    ]);
  }

  removePrecio(p: Precio): void {
    if (p.idprecios) this.preciosRemovidos.push(p.idprecios);
    this.precios.update((items) => items.filter((item) => item !== p));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPrecioChange(_p: Precio): void {
    // Marcar como modificado - no necesita acción adicional, el objeto en la signal ya está mutado
  }

  private buildPresGroup(data: Partial<PresentacionForm>) {
    return this.fb.group({
      idpresentacion: [data.idpresentacion ?? null, Validators.required],
      cantidad_base: [data.cantidad_base ?? 1],
      precio_venta: [data.precio_venta ?? 0],
      codigo_barras: [data.codigo_barras ?? ''],
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const presentaciones = ((v['presentaciones'] ?? []) as PresentacionForm[]).map((p) => ({
      idpresentacion: p.idpresentacion,
      cantidad_base: Number(p.cantidad_base) || 1,
      precio_venta: Number(p.precio_venta) || 0,
      codigo_barras: p.codigo_barras || null,
    }));

    if (!this.data && presentaciones.length === 0) {
      this.snackBar.open('Agregá al menos una presentación', 'Cerrar', { duration: 3000 });
      return;
    }

    const payload: Record<string, unknown> = {
      nombre: v.nombre,
      descripcion: v.descripcion ?? '',
      idcategoria: v.idcategoria,
      idmarca: v.idmarca,
      idunidad: v.idunidad,
      stock_minimo: Number(v.stock_minimo) || 0,
      estado: v.estado ? 1 : 0,
      controla_vencimiento: !!v.controla_vencimiento,
    };

    // Solo enviar presentaciones si se modificaron (o es nuevo)
    if (presentaciones.length > 0 || !this.data) {
      payload['presentaciones'] = presentaciones;
    }

    const obs = this.data
      ? this.service.update(this.data.codigoprod!, payload)
      : this.service.create(payload);

    obs.subscribe({
      next: (productoGuardado: Producto) => {
        const presGuardadas = productoGuardado?.Presentaciones || [];

        // Si es nuevo, actualizar presentacionesProducto con los IDs reales
        if (!this.data && presGuardadas.length) {
          this.presentacionesProducto = presGuardadas;
        }

        // Persistir cambios en precios
        const ops: Observable<unknown>[] = [];

        // Eliminar precios marcados
        for (const id of this.preciosRemovidos) {
          ops.push(this.precioService.delete(id));
        }

        // Crear o actualizar precios
        for (const p of this.precios()) {
          let idprodPresenta: number | undefined = p.idprodPresenta;

          // Para productos nuevos, mapear idprodPresenta temporal al real
          if (!this.data && presGuardadas.length && idprodPresenta < 0) {
            const idx = Math.abs(idprodPresenta) - 1;
            const idpres = this.presentacionesArray.controls[idx]?.get('idpresentacion')?.value;
            const real = presGuardadas.find(
              (pg: ProductoPresentacion) => pg.idpresentacion === idpres,
            );
            idprodPresenta = real?.idprodPresenta ?? presGuardadas[0]?.idprodPresenta;
          }

          if (!idprodPresenta) {
            console.warn('Precio sin presentación, se omite:', p);
            continue;
          }

          const data = { ...p, idprodPresenta };
          if (p.idprecios) {
            ops.push(this.precioService.update(p.idprecios, data));
          } else {
            ops.push(this.precioService.create(data));
          }
        }

        if (ops.length) {
          forkJoin(ops).subscribe({
            error: () =>
              this.snackBar.open('Error al guardar precios', 'Cerrar', { duration: 3000 }),
          });
        }

        this.snackBar.open(`Producto ${this.data ? 'actualizado' : 'creado'}`, 'Cerrar', {
          duration: 2000,
        });
        this.router.navigate(['/productos']);
      },
      error: () => this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 }),
    });
  }

  goBack(): void {
    this.router.navigate(['/productos']);
  }

  async scanBarcode(index: number): Promise<void> {
    const { BarcodeScannerComponent } = await import('../../pos/barcode-scanner.component');
    const ref = this.dialog.open(BarcodeScannerComponent, {
      width: '500px',
      disableClose: true,
      data: {
        onDetect: () => Promise.resolve(true),
      },
    });
    ref.afterClosed().subscribe((code: string | null) => {
      if (code) {
        const group = this.presentacionesArray.controls[index];
        group.get('codigo_barras')?.setValue(code);
      }
    });
  }
}
