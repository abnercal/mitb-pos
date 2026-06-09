import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProveedorService } from '../../core/services/proveedor.service';
import { Proveedor } from '../../core/interfaces/proveedor.interface';

@Component({
  selector: 'app-proveedor-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSlideToggleModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nuevo' }} proveedor</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <div class="form-row">
          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Nombre *</mat-label>
            <input matInput formControlName="nombre" placeholder="Nombre del proveedor" autocomplete="off">
            <mat-error>El nombre es requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>NIT</mat-label>
            <input matInput formControlName="nit" placeholder="NIT" autocomplete="off">
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Teléfono</mat-label>
            <input matInput formControlName="telefono" placeholder="Ej: 1234-5678" autocomplete="off">
          </mat-form-field>

          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" placeholder="correo@ejemplo.com" autocomplete="off" type="email">
          </mat-form-field>
        </div>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Dirección</mat-label>
          <input matInput formControlName="direccion" placeholder="Dirección del proveedor" autocomplete="off">
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
export class ProveedorFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProveedorService);
  private readonly dialogRef = inject(MatDialogRef<ProveedorFormComponent>);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly data: Proveedor | null = inject(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    nombre: [this.data?.nombre ?? '', Validators.required],
    nit: [this.data?.nit ?? ''],
    telefono: [this.data?.telefono ?? ''],
    email: [this.data?.email ?? ''],
    direccion: [this.data?.direccion ?? ''],
    estado: [this.data?.estado ?? 1],
  });

  submit(): void {
    if (this.form.invalid) return;
    const payload: any = { ...this.form.value, estado: this.form.get('estado')?.value ? 1 : 0 };
    const obs = this.data ? this.service.update(this.data._id!, payload) : this.service.create(payload);
    obs.subscribe({
      next: () => { this.snackBar.open(`Proveedor ${this.data ? 'actualizado' : 'creado'}`, 'Cerrar', { duration: 2000 }); this.dialogRef.close(true); },
      error: () => this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 }),
    });
  }
}
