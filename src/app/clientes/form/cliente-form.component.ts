import { Component, inject } from '@angular/core';

import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ClienteService } from '../../core/services/cliente.service';
import { TipoClienteService } from '../../core/services/tipo-cliente.service';
import { Cliente, TipoClie } from '../../core/interfaces/cliente.interface';
import { BaseFormComponent } from '../../shared/components/base-form';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  templateUrl: './cliente-form.component.html',
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
export class ClienteFormComponent extends BaseFormComponent<Cliente> {
  private readonly tipoService = inject(TipoClienteService);
  protected override crudService = inject(ClienteService);
  override entityName = 'Cliente';

  tipos: TipoClie[] = [];

  override form = this.fb.group({
    nombres: [this.data?.nombres ?? '', Validators.required],
    apellidos: [this.data?.apellidos ?? ''],
    idtipoCli: [this.data?.idtipoCli ?? null, Validators.required],
    nit: [this.data?.nit ?? ''],
    telefono: [this.data?.telefono ?? ''],
    email: [this.data?.email ?? ''],
    direccion: [this.data?.direccion ?? ''],
    estado: [this.data?.estado ?? 1],
  });

  override loadDependencies(): void {
    this.tipoService.getAll().subscribe({
      next: (res) => { this.tipos = res; },
    });
  }
}
