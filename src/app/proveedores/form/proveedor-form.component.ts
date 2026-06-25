import { Component, inject } from '@angular/core';

import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ProveedorService } from '../../core/services/proveedor.service';
import { Proveedor } from '../../core/interfaces/proveedor.interface';
import { BaseFormComponent } from '../../shared/components/base-form';

@Component({
  selector: 'app-proveedor-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nuevo' }} proveedor</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <div class="form-row">
          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Nombre *</mat-label>
            <input
              matInput
              formControlName="nombre"
              placeholder="Nombre del proveedor"
              autocomplete="off"
            />
            <mat-error>El nombre es requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>NIT</mat-label>
            <input matInput formControlName="nit" placeholder="NIT" autocomplete="off" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Teléfono</mat-label>
            <input
              matInput
              formControlName="telefono"
              placeholder="Ej: 1234-5678"
              autocomplete="off"
            />
          </mat-form-field>

          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Email</mat-label>
            <input
              matInput
              formControlName="email"
              placeholder="correo@ejemplo.com"
              autocomplete="off"
              type="email"
            />
          </mat-form-field>
        </div>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Dirección</mat-label>
          <input
            matInput
            formControlName="direccion"
            placeholder="Dirección del proveedor"
            autocomplete="off"
          />
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
  styles: [
    `
      .full-width {
        width: 100%;
        margin-bottom: 16px;
      }
      .form-row {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
      }
      .flex-1 {
        flex: 1;
      }
      .toggle-row {
        margin: 16px 0;
      }
    `,
  ],
})
export class ProveedorFormComponent extends BaseFormComponent<Proveedor> {
  protected override crudService = inject(ProveedorService);
  override entityName = 'Proveedor';

  override form = this.fb.group({
    nombre: [this.data?.nombre ?? '', Validators.required],
    nit: [this.data?.nit ?? ''],
    telefono: [this.data?.telefono ?? ''],
    email: [this.data?.email ?? ''],
    direccion: [this.data?.direccion ?? ''],
    estado: [this.data?.estado ?? 1],
  });
}
