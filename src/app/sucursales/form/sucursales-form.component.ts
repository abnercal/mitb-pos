import { Component, inject } from '@angular/core';

import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SucursalService } from '../../core/services/sucursal.service';
import { Sucursal } from '../../core/interfaces/sucursal.interface';
import { BaseFormComponent } from '../../shared/components/base-form';

@Component({
  selector: 'app-sucursales-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar sucursal' : 'Nueva sucursal' }}</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Nombre *</mat-label>
            <input matInput formControlName="nombre" required />
            @if (form.get('nombre')?.hasError('required')) {
              <mat-error>El nombre es requerido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Teléfono</mat-label>
            <input matInput formControlName="telefono" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Dirección</mat-label>
            <input matInput formControlName="direccion" />
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button
          mat-raised-button
          color="primary"
          type="submit"
          [disabled]="form.invalid || saving()"
        >
          {{ saving() ? 'Guardando…' : 'Guardar' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        padding-top: 12px;
      }
      .full-width {
        grid-column: 1 / -1;
      }
    `,
  ],
})
export class SucursalesFormComponent extends BaseFormComponent<Sucursal> {
  protected override crudService = inject(SucursalService);
  override entityName = 'Sucursal';

  override form = this.fb.group({
    nombre: [this.data?.nombre ?? '', Validators.required],
    telefono: [this.data?.telefono ?? ''],
    direccion: [this.data?.direccion ?? ''],
  });

  // Sucursal usa idsucursal como PK, no _id
  protected override updateEntity() {
    return this.crudService.update(
      (this.data as Sucursal).idsucursal!,
      this.buildPayload() as Partial<Sucursal>,
    );
  }
}
