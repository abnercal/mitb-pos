import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CategoriaService } from '../../core/services/categoria.service';
import { Categoria } from '../../core/interfaces/categoria.interface';

@Component({
  selector: 'app-categoria-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nueva' }} categoría</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" placeholder="Nombre de la categoría" autocomplete="off">
          <mat-error *ngIf="form.get('nombre')?.hasError('required')">El nombre es requerido</mat-error>
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
    .toggle-row { margin: 16px 0; }
  `],
})
export class CategoriaFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CategoriaService);
  private readonly dialogRef = inject(MatDialogRef<CategoriaFormComponent>);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly data: Categoria | null = inject(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    nombre: [this.data?.nombre ?? '', Validators.required],
    estado: [this.data?.estado ?? 1],
  });

  submit(): void {
    if (this.form.invalid) return;
    const nombre = this.form.get('nombre')?.value ?? undefined;
    const payload = { nombre, estado: this.form.get('estado')?.value ? 1 : 0 };

    const obs = this.data
      ? this.service.update(this.data._id!, payload)
      : this.service.create(payload);

    obs.subscribe({
      next: () => {
        this.snackBar.open(`Categoría ${this.data ? 'actualizada' : 'creada'}`, 'Cerrar', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: () => this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 }),
    });
  }
}
