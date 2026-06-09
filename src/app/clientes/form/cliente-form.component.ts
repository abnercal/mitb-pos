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
import { ClienteService } from '../../core/services/cliente.service';
import { TipoClienteService } from '../../core/services/tipo-cliente.service';
import { Cliente, TipoClie } from '../../core/interfaces/cliente.interface';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatSlideToggleModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nuevo' }} cliente</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <div class="form-row">
          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Nombres *</mat-label>
            <input matInput formControlName="nombres" placeholder="Nombres del cliente" autocomplete="off">
            <mat-error>Los nombres son requeridos</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Apellidos</mat-label>
            <input matInput formControlName="apellidos" placeholder="Apellidos" autocomplete="off">
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="fill" class="flex-1">
            <mat-label>Tipo de cliente *</mat-label>
            <mat-select formControlName="idtipoCli">
              <mat-option *ngFor="let t of tipos" [value]="t.idtipoCli">{{ t.nombre }}</mat-option>
            </mat-select>
            <mat-error>El tipo es requerido</mat-error>
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
          <input matInput formControlName="direccion" placeholder="Dirección del cliente" autocomplete="off">
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
export class ClienteFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ClienteService);
  private readonly tipoService = inject(TipoClienteService);
  private readonly dialogRef = inject(MatDialogRef<ClienteFormComponent>);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly data: Cliente | null = inject(MAT_DIALOG_DATA);

  tipos: TipoClie[] = [];

  readonly form = this.fb.group({
    nombres: [this.data?.nombres ?? '', Validators.required],
    apellidos: [this.data?.apellidos ?? ''],
    idtipoCli: [this.data?.idtipoCli ?? null, Validators.required],
    nit: [this.data?.nit ?? ''],
    telefono: [this.data?.telefono ?? ''],
    email: [this.data?.email ?? ''],
    direccion: [this.data?.direccion ?? ''],
    estado: [this.data?.estado ?? 1],
  });

  ngOnInit(): void {
    this.tipoService.getAll().subscribe({
      next: (res) => {
        this.tipos = res;
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = {
      nombres: v.nombres ?? undefined,
      apellidos: v.apellidos || '',
      idtipoCli: v.idtipoCli ?? undefined,
      nit: v.nit || '',
      telefono: v.telefono || '',
      email: v.email || '',
      direccion: v.direccion || '',
      estado: v.estado ? 1 : 0,
    };
    const obs = this.data ? this.service.update(this.data._id!, payload) : this.service.create(payload);
    obs.subscribe({
      next: () => { this.snackBar.open(`Cliente ${this.data ? 'actualizado' : 'creado'}`, 'Cerrar', { duration: 2000 }); this.dialogRef.close(true); },
      error: () => this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 }),
    });
  }
}
