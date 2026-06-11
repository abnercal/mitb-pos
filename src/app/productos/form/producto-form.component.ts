import { Component, OnInit, DestroyRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
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
import { Categoria } from '../../core/interfaces/categoria.interface';
import { Marca } from '../../core/interfaces/marca.interface';
import { Presentacion } from '../../core/interfaces/presentacion.interface';
import { Unidad } from '../../core/interfaces/unidad.interface';
import { TipoClie } from '../../core/interfaces/cliente.interface';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatSlideToggleModule,
    MatIconModule, MatSnackBarModule, MatDatepickerModule, MatNativeDateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nuevo' }} producto</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <!-- Datos generales del producto -->
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Nombre del producto *</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej: Huevos" autocomplete="off">
          <mat-error>El nombre es requerido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Descripción</mat-label>
          <input matInput formControlName="descripcion" placeholder="Descripción opcional" autocomplete="off">
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Categoría</mat-label>
            <mat-select formControlName="idcategoria">
              <mat-option [value]="null">Sin categoría</mat-option>
              <mat-option *ngFor="let c of categorias" [value]="c._id">{{ c.nombre }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Marca</mat-label>
            <mat-select formControlName="idmarca">
              <mat-option [value]="null">Sin marca</mat-option>
              <mat-option *ngFor="let m of marcas" [value]="m._id">{{ m.nombre }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Unidad de medida base</mat-label>
          <mat-select formControlName="idunidad">
            <mat-option [value]="null">Sin unidad</mat-option>
            <mat-option *ngFor="let u of unidades" [value]="u._id">{{ u.nombre }} ({{ u.abreviatura }})</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Stock mínimo (en unidades base)</mat-label>
          <input matInput formControlName="stock_minimo" type="number" step="0.01" placeholder="0">
          <mat-hint>Ej: si tu mínimo son 2 cajas de 30 huevos, poné 60</mat-hint>
        </mat-form-field>

        <!-- Sección de presentaciones múltiples -->
        <div class="section-title">
          <span>Presentaciones</span>
          <button type="button" mat-mini-fab color="primary" (click)="addPresentacion()"
                  matTooltip="Agregar presentación">
            <mat-icon>add</mat-icon>
          </button>
        </div>

        <div formArrayName="presentaciones" class="pres-grid">
          <div *ngFor="let pres of presentacionesArray.controls; let i = index; let last = last" 
               [formGroupName]="i" class="pres-row">
            <mat-form-field appearance="fill" class="pres-select">
              <mat-label>Presentación *</mat-label>
              <mat-select formControlName="idpresentacion" required>
                <mat-option [value]="null">Seleccionar</mat-option>
                <mat-option *ngFor="let p of presentacionesDisponibles(i)" [value]="p._id">{{ p.nombre }}</mat-option>
              </mat-select>
              <mat-error>Requerido</mat-error>
            </mat-form-field>

            <mat-form-field appearance="fill" class="pres-qty">
              <mat-label>Cant. base</mat-label>
              <input matInput formControlName="cantidad_base" type="number" step="0.01" placeholder="1">
            </mat-form-field>

            <mat-form-field appearance="fill" class="pres-price">
              <mat-label>Precio venta</mat-label>
              <input matInput formControlName="precio_venta" type="number" step="0.01" placeholder="0.00">
            </mat-form-field>

            <mat-form-field appearance="fill" class="pres-barcode">
              <mat-label>Código barras</mat-label>
              <input matInput formControlName="codigo_barras" placeholder="Opcional">
            </mat-form-field>

            <button type="button" mat-icon-button color="warn" 
                    (click)="removePresentacion(i)" matTooltip="Quitar">
              <mat-icon>remove_circle</mat-icon>
            </button>
          </div>

          <div *ngIf="presentacionesArray.length === 0" class="pres-empty">
            <p>No hay presentaciones. Agregá al menos una.</p>
          </div>
        </div>

        <!-- Sección Precios por tipo de cliente -->
        <div class="section-title">
          <span>Precios por tipo de cliente</span>
          <button type="button" mat-mini-fab color="primary" (click)="addPrecio()">
            <mat-icon>add</mat-icon>
          </button>
        </div>

        <div class="precios-table" *ngIf="precios().length">
          <div class="precios-header">
            <span>Presentación</span>
            <span>Tipo Cliente</span>
            <span>Precio</span>
            <span>Tipo</span>
            <span>Vigencia</span>
            <span></span>
          </div>
          <div class="precios-row" *ngFor="let p of precios(); let i = index">
            <mat-form-field appearance="fill">
              <mat-label>Presentación</mat-label>
              <mat-select [(ngModel)]="p.idprodPresenta" (ngModelChange)="onPrecioChange(i)" [ngModelOptions]="{standalone: true}">
                <mat-option *ngFor="let pp of presOptions()" [value]="pp.idprodPresenta">
                  {{ pp.Presentacion?.nombre }}
                </mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>Tipo cliente</mat-label>
              <mat-select [(ngModel)]="p.idtipoCli" (ngModelChange)="onPrecioChange(i)" [ngModelOptions]="{standalone: true}">
                <mat-option *ngFor="let tc of tiposCliente" [value]="tc.idtipoCli">{{ tc.nombre }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>Precio Q</mat-label>
              <input matInput type="number" step="0.01" [(ngModel)]="p.precio" (ngModelChange)="onPrecioChange(i)" [ngModelOptions]="{standalone: true}">
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>Tipo</mat-label>
              <mat-select [(ngModel)]="p.tipoprecio" (ngModelChange)="onPrecioChange(i)" [ngModelOptions]="{standalone: true}">
                <mat-option value="regular">Regular</mat-option>
                <mat-option value="mayorista">Mayorista</mat-option>
                <mat-option value="especial">Especial</mat-option>
              </mat-select>
            </mat-form-field>
            <div class="vigencia-fields">
              <mat-form-field appearance="fill">
                <mat-label>Desde</mat-label>
                <input matInput [matDatepicker]="dpDesde" [(ngModel)]="p.fechaefecto" (ngModelChange)="onPrecioChange(i)" [ngModelOptions]="{standalone: true}">
                <mat-datepicker-toggle matSuffix [for]="dpDesde"></mat-datepicker-toggle>
                <mat-datepicker #dpDesde></mat-datepicker>
              </mat-form-field>
              <mat-form-field appearance="fill">
                <mat-label>Hasta</mat-label>
                <input matInput [matDatepicker]="dpHasta" [(ngModel)]="p.fechafin" (ngModelChange)="onPrecioChange(i)" [ngModelOptions]="{standalone: true}">
                <mat-datepicker-toggle matSuffix [for]="dpHasta"></mat-datepicker-toggle>
                <mat-datepicker #dpHasta></mat-datepicker>
              </mat-form-field>
            </div>
            <button type="button" mat-icon-button color="warn" (click)="removePrecio(i)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>

        <div *ngIf="!precios().length" class="empty-precios">
          <p>No hay precios especiales configurados. Se usará <strong>precio_venta</strong> como predeterminado.</p>
        </div>

        <div class="toggle-row">
          <mat-slide-toggle formControlName="estado" color="primary">
            {{ form.get('estado')?.value ? 'Activo' : 'Inactivo' }}
          </mat-slide-toggle>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
          {{ data ? 'Actualizar' : 'Crear' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 16px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .flex-1 { flex: 1; }
    .toggle-row { margin: 16px 0; }
    .section-title { display: flex; align-items: center; gap: 12px; margin: 20px 0 12px; font-size: 16px; font-weight: 500; }
    .pres-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
    .pres-row { display: flex; gap: 8px; align-items: flex-start; flex-wrap: wrap; }
    .pres-select { flex: 2; }
    .pres-qty { flex: 1; }
    .pres-price { flex: 1; }
    .pres-barcode { flex: 1.5; }
    .pres-empty { text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; color: #999; font-size: 14px; }
    .precios-table { display: flex; flex-direction: column; gap: 8px; margin: 8px 0; }
    .precios-header { display: flex; gap: 8px; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; padding: 0 4px; flex-wrap: wrap; }
    .precios-header span { min-width: 100px; }
    .precios-header span:nth-child(1) { flex: 2; min-width: 130px; }
    .precios-header span:nth-child(2) { flex: 2; min-width: 140px; }
    .precios-header span:nth-child(3) { flex: 1; min-width: 100px; }
    .precios-header span:nth-child(4) { flex: 1; min-width: 110px; }
    .precios-header span:nth-child(5) { flex: 2; min-width: 200px; }
    .precios-header span:nth-child(6) { width: 40px; }
    .precios-row { display: flex; gap: 8px; align-items: flex-start; flex-wrap: wrap; }
    .precios-row mat-form-field:nth-child(1) { flex: 2; min-width: 130px; }
    .precios-row mat-form-field:nth-child(2) { flex: 2; min-width: 140px; }
    .precios-row mat-form-field:nth-child(3) { flex: 1; min-width: 100px; }
    .precios-row mat-form-field:nth-child(4) { flex: 1; min-width: 110px; }
    .vigencia-fields { flex: 2; display: flex; gap: 4px; min-width: 200px; }
    .vigencia-fields mat-form-field { flex: 1; }
    .empty-precios { text-align: center; padding: 16px; background: #fafafa; border-radius: 8px; color: #888; font-size: 13px; border: 1px dashed #ddd; margin: 8px 0; }
  `],
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
  private readonly dialogRef = inject(MatDialogRef<ProductoFormComponent>);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly data: Producto | null = inject(MAT_DIALOG_DATA);
  private readonly destroyRef = inject(DestroyRef);

  categorias: Categoria[] = [];
  marcas: Marca[] = [];
  todasPresentaciones: Presentacion[] = [];
  unidades: Unidad[] = [];
  tiposCliente: TipoClie[] = [];

  readonly precios = signal<Precio[]>([]);
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
        const pres = this.todasPresentaciones.find(p => p._id === idpres);
        return {
          idprodPresenta: -(i + 1),
          Presentacion: pres ? { nombre: pres.nombre } : { nombre: `Presentación ${i + 1}` },
        };
      })
      .filter((p): p is { idprodPresenta: number; Presentacion: { nombre: string } } => p != null);
  });

  readonly form = this.fb.group({
    nombre: [this.data?.nombre ?? '', Validators.required],
    descripcion: [this.data?.descripcion ?? ''],
    idcategoria: [this.data?.idcategoria ?? null],
    idmarca: [this.data?.idmarca ?? null],
    idunidad: [this.data?.idunidad ?? null],
    stock_minimo: [this.data?.stock_minimo ?? 0],
    estado: [this.data?.estado ?? 1],
    presentaciones: this.fb.array([]),
  });

  get presentacionesArray(): FormArray {
    return this.form.get('presentaciones') as FormArray;
  }

  ngOnInit(): void {
    this.categoriaService.getAllList().subscribe(r => this.categorias = r);
    this.marcaService.getAllList().subscribe(r => this.marcas = r);
    this.presentacionService.getAllList().subscribe(r => {
      this.todasPresentaciones = r;

      // Si estamos editando, cargar presentaciones existentes
      if (this.data?.Presentaciones?.length) {
        for (const pp of this.data.Presentaciones) {
          this.presentacionesArray.push(this.buildPresGroup({
            idpresentacion: pp.idpresentacion,
            cantidad_base: pp.cantidad_base,
            precio_venta: pp.precio_venta,
            codigo_barras: pp.codigo_barras ?? '',
          }));
        }
      }
    });
    this.unidadService.getAllList().subscribe(r => this.unidades = r);

    // Cargar tipos de cliente
    this.tipoClienteService.getAll().subscribe({
      next: r => this.tiposCliente = r,
      error: () => this.snackBar.open('Error al cargar tipos de cliente', 'Cerrar', { duration: 3000 }),
    });

    // Cargar presentaciones del producto (para edición o recién creado)
    if (this.data?.Presentaciones?.length) {
      this.presentacionesProducto = this.data.Presentaciones.filter(pp => pp.estado !== 0);
    }

    // Si estamos editando, cargar precios existentes
    if (this.data?.codigoprod) {
      this.precioService.getByProducto(this.data.codigoprod).subscribe({
        next: r => this.precios.set(r),
        error: () => this.precios.set([]),
      });
    }

    // Recalcular presOptions cada vez que cambien las presentaciones del form
    this.presentacionesArray.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formVersion.update(v => v + 1));
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
    this.precios.update(p => [...p, {
      idprodPresenta: primeraPres?.idprodPresenta ?? 0,
      idtipoCli: this.tiposCliente[0]?.idtipoCli ?? 0,
      precio: 0,
      tipoprecio: 'regular',
      fechaefecto: undefined,
      fechafin: undefined,
    }]);
  }

  removePrecio(index: number): void {
    const p = this.precios()[index];
    if (p.idprecios) this.preciosRemovidos.push(p.idprecios);
    this.precios.update(items => items.filter((_, i) => i !== index));
  }

  onPrecioChange(index: number): void {
    // Marcar como modificado - no necesita acción adicional, el objeto en la signal ya está mutado
  }

  private buildPresGroup(data: any) {
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
    const presentaciones = (v.presentaciones ?? []).map((p: any) => ({
      idpresentacion: p.idpresentacion,
      cantidad_base: Number(p.cantidad_base) || 1,
      precio_venta: Number(p.precio_venta) || 0,
      codigo_barras: p.codigo_barras || null,
    }));

    if (!this.data && presentaciones.length === 0) {
      this.snackBar.open('Agregá al menos una presentación', 'Cerrar', { duration: 3000 });
      return;
    }

    const payload: any = {
      nombre: v.nombre,
      descripcion: v.descripcion ?? '',
      idcategoria: v.idcategoria,
      idmarca: v.idmarca,
      idunidad: v.idunidad,
      stock_minimo: Number(v.stock_minimo) || 0,
      estado: v.estado ? 1 : 0,
    };

    // Solo enviar presentaciones si se modificaron (o es nuevo)
    if (presentaciones.length > 0 || !this.data) {
      payload.presentaciones = presentaciones;
    }

    const obs = this.data
      ? this.service.update(this.data.codigoprod!, payload)
      : this.service.create(payload);

    obs.subscribe({
      next: (productoGuardado: any) => {
        const presGuardadas = productoGuardado?.Presentaciones || [];

        // Si es nuevo, actualizar presentacionesProducto con los IDs reales
        if (!this.data && presGuardadas.length) {
          this.presentacionesProducto = presGuardadas;
        }

        // Persistir cambios en precios
        const ops: Observable<any>[] = [];

        // Eliminar precios marcados
        for (const id of this.preciosRemovidos) {
          ops.push(this.precioService.delete(id));
        }

        // Crear o actualizar precios
        for (const p of this.precios()) {
          let idprodPresenta = p.idprodPresenta;

          // Para productos nuevos, mapear idprodPresenta temporal al real
          if (!this.data && presGuardadas.length && idprodPresenta < 0) {
            const idx = Math.abs(idprodPresenta) - 1;
            const idpres = this.presentacionesArray.controls[idx]?.get('idpresentacion')?.value;
            const real = presGuardadas.find((pg: any) => pg.idpresentacion === idpres);
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
            error: () => this.snackBar.open('Error al guardar precios', 'Cerrar', { duration: 3000 }),
          });
        }

        this.snackBar.open(`Producto ${this.data ? 'actualizado' : 'creado'}`, 'Cerrar', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: () => this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 }),
    });
  }
}
