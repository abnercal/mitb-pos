import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SucursalService } from '../../core/services/sucursal.service';
import { Sucursal } from '../../core/interfaces/sucursal.interface';

export interface SucursalFormData { sucursal: Sucursal | null; }

@Component({
  selector: 'app-sucursales-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>{{ data.sucursal ? 'Editar sucursal' : 'Nueva sucursal' }}</h2>
    <mat-dialog-content>
      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Nombre *</mat-label>
          <input matInput [(ngModel)]="form.nombre" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Teléfono</mat-label>
          <input matInput [(ngModel)]="form.telefono">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Dirección</mat-label>
          <input matInput [(ngModel)]="form.direccion">
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="saving() || !form.nombre" (click)="save()">
        {{ saving() ? 'Guardando…' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 12px; }
    .full-width { grid-column: 1 / -1; }`],
})
export class SucursalesFormComponent implements OnInit {
  private readonly service = inject(SucursalService);
  private readonly dialogRef = inject(MatDialogRef<SucursalesFormComponent>);
  readonly data: SucursalFormData = inject(MAT_DIALOG_DATA);
  private readonly snackBar = inject(MatSnackBar);
  readonly saving = signal(false);
  form = { nombre: '', direccion: '', telefono: '' };

  ngOnInit(): void {
    if (this.data.sucursal) {
      this.form = {
        nombre: this.data.sucursal.nombre,
        direccion: this.data.sucursal.direccion || '',
        telefono: this.data.sucursal.telefono || '',
      };
    }
  }

  save(): void {
    this.saving.set(true);
    const obs = this.data.sucursal
      ? this.service.update(this.data.sucursal._id!, this.form)
      : this.service.create(this.form);
    obs.subscribe({
      next: () => {
        this.snackBar.open(this.data.sucursal ? 'Sucursal actualizada' : 'Sucursal creada', 'Cerrar', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: () => { this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 }); this.saving.set(false); },
    });
  }
}
