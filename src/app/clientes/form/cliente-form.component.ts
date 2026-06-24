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
  templateUrl: './cliente-form.component.html',
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
