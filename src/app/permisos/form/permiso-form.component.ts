import { Component, inject } from '@angular/core';

import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PermisoService } from '../../core/services/permiso.service';
import { Permiso } from '../../core/interfaces/permiso.interface';
import { BaseFormComponent } from '../../shared/components/base-form';

@Component({
  selector: 'app-permiso-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar permiso' : 'Nuevo permiso' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre del permiso</mat-label>
          <input
            matInput
            formControlName="nombre"
            placeholder="ej: reportes:inventario"
            autocomplete="off"
          />
          @if (form.get('nombre')?.hasError('required')) {
            <mat-error>El nombre es requerido</mat-error>
          }
        </mat-form-field>
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
    `,
  ],
})
export class PermisoFormComponent extends BaseFormComponent<Permiso> {
  protected override crudService = inject(PermisoService);
  override entityName = 'Permiso';

  override form = this.fb.group({ nombre: [this.data?.nombre ?? '', Validators.required] });
}
