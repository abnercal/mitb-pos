import { Component, inject } from '@angular/core';

import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { UnidadService } from '../../core/services/unidad.service';
import { Unidad } from '../../core/interfaces/unidad.interface';
import { BaseFormComponent } from '../../shared/components/base-form';

@Component({
  selector: 'app-unidad-form',
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
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nueva' }} unidad</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej: Kilogramo" autocomplete="off" />
          @if (form.get('nombre')?.hasError('required')) {
            <mat-error>El nombre es requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Abreviatura</mat-label>
          <input matInput formControlName="abreviatura" placeholder="Ej: kg" autocomplete="off" />
          @if (form.get('abreviatura')?.hasError('required')) {
            <mat-error>La abreviatura es requerida</mat-error>
          }
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
      .toggle-row {
        margin: 16px 0;
      }
    `,
  ],
})
export class UnidadFormComponent extends BaseFormComponent<Unidad> {
  protected override crudService = inject(UnidadService);
  override entityName = 'Unidad';
  override entityGender: 'F' = 'F';

  override form = this.fb.group({
    nombre: [this.data?.nombre ?? '', Validators.required],
    abreviatura: [this.data?.abreviatura ?? '', Validators.required],
    estado: [this.data?.estado ?? 1],
  });
}
