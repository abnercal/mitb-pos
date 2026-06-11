import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PermisoService } from '../../core/services/permiso.service';
import { Permiso } from '../../core/interfaces/permiso.interface';

@Component({
  selector: 'app-permiso-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar permiso' : 'Nuevo permiso' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre del permiso</mat-label>
          <input matInput formControlName="nombre" placeholder="ej: reportes:inventario" autocomplete="off">
          <mat-error *ngIf="form.get('nombre')?.hasError('required')">El nombre es requerido</mat-error>
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
  styles: [`.full-width { width: 100%; margin-bottom: 16px; }`],
})
export class PermisoFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PermisoService);
  private readonly dialogRef = inject(MatDialogRef<PermisoFormComponent>);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly data: Permiso | null = inject(MAT_DIALOG_DATA);
  readonly form = this.fb.group({ nombre: [this.data?.nombre ?? '', Validators.required] });

  submit(): void {
    if (this.form.invalid) return;
    const nombre = this.form.get('nombre')?.value?.trim();
    if (!nombre) return;
    const payload = { nombre };
    const obs = this.data
      ? this.service.update(this.data._id!, payload)
      : this.service.create(payload);
    obs.subscribe({
      next: () => {
        this.snackBar.open(`Permiso ${this.data ? 'actualizado' : 'creado'}`, 'Cerrar', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: () => this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 }),
    });
  }
}
