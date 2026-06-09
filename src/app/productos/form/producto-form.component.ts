import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductoService } from '../../core/services/producto.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { MarcaService } from '../../core/services/marca.service';
import { PresentacionService } from '../../core/services/presentacion.service';
import { UnidadService } from '../../core/services/unidad.service';
import { Producto } from '../../core/interfaces/producto.interface';
import { Categoria } from '../../core/interfaces/categoria.interface';
import { Marca } from '../../core/interfaces/marca.interface';
import { Presentacion } from '../../core/interfaces/presentacion.interface';
import { Unidad } from '../../core/interfaces/unidad.interface';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatSlideToggleModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nuevo' }} producto</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Nombre del producto *</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej: Arroz Diana x5lb" autocomplete="off">
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

        <div class="form-row">
          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Presentación</mat-label>
            <mat-select formControlName="idpresentacion">
              <mat-option [value]="null">Sin presentación</mat-option>
              <mat-option *ngFor="let p of presentaciones" [value]="p._id">{{ p.nombre }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Unidad de medida</mat-label>
            <mat-select formControlName="idunidad">
              <mat-option [value]="null">Sin unidad</mat-option>
              <mat-option *ngFor="let u of unidades" [value]="u._id">{{ u.nombre }} ({{ u.abreviatura }})</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Precio de venta</mat-label>
          <input matInput formControlName="precio" type="number" step="0.01" placeholder="0.00">
        </mat-form-field>

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
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .flex-1 { flex: 1; }
    .toggle-row { margin: 16px 0; }
  `],
})
export class ProductoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly marcaService = inject(MarcaService);
  private readonly presentacionService = inject(PresentacionService);
  private readonly unidadService = inject(UnidadService);
  private readonly dialogRef = inject(MatDialogRef<ProductoFormComponent>);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly data: Producto | null = inject(MAT_DIALOG_DATA);

  categorias: Categoria[] = [];
  marcas: Marca[] = [];
  presentaciones: Presentacion[] = [];
  unidades: Unidad[] = [];

  readonly form = this.fb.group({
    nombre: [this.data?.nombre ?? '', Validators.required],
    descripcion: [this.data?.descripcion ?? ''],
    idcategoria: [this.data?.idcategoria ?? null],
    idmarca: [this.data?.idmarca ?? null],
    idpresentacion: [this.data?.idpresentacion ?? null],
    idunidad: [this.data?.idunidad ?? null],
    precio: [this.data?.precio ?? null],
    estado: [this.data?.estado ?? 1],
  });

  ngOnInit(): void {
    this.categoriaService.getAll().subscribe(r => this.categorias = r);
    this.marcaService.getAll().subscribe(r => this.marcas = r);
    this.presentacionService.getAll().subscribe(r => this.presentaciones = r);
    this.unidadService.getAll().subscribe(r => this.unidades = r);
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload: any = { ...v, precio: v.precio ? Number(v.precio) : 0, estado: v.estado ? 1 : 0 };
    const obs = this.data
      ? this.service.update(this.data.codigoprod!, payload)
      : this.service.create(payload);
    obs.subscribe({
      next: () => { this.snackBar.open(`Producto ${this.data ? 'actualizado' : 'creado'}`, 'Cerrar', { duration: 2000 }); this.dialogRef.close(true); },
      error: () => this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 }),
    });
  }
}
