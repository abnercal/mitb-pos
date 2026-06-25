import { Component, inject, signal } from '@angular/core';

import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RolService } from '../../core/services/rol.service';
import { PermisoService } from '../../core/services/permiso.service';
import { Rol } from '../../core/interfaces/rol.interface';
import { Permiso } from '../../core/interfaces/permiso.interface';
import { BaseFormComponent } from '../../shared/components/base-form';

@Component({
  selector: 'app-roles-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatCheckboxModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar rol' : 'Nuevo rol' }}</h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre del rol *</mat-label>
          <input matInput formControlName="nombrerol" required />
          @if (form.get('nombrerol')?.hasError('required')) {
            <mat-error>El nombre es requerido</mat-error>
          }
        </mat-form-field>

        <h3 class="perm-title">Permisos</h3>
        <div class="perm-grid">
          @for (p of permisos(); track p) {
            <div class="perm-item">
              <mat-checkbox
                [checked]="selectedPermisos().includes(p._id!)"
                (change)="togglePermiso(p._id!)"
              ></mat-checkbox>
              <span>{{ p.nombre }}</span>
            </div>
          }
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
      .full-width {
        width: 100%;
        margin-bottom: 12px;
      }
      .perm-title {
        font-size: 16px;
        font-weight: 500;
        margin: 16px 0 8px;
      }
      .perm-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        max-height: 300px;
        overflow-y: auto;
      }
      .perm-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
        cursor: pointer;
        font-size: 14px;
      }
    `,
  ],
})
export class RolesFormComponent extends BaseFormComponent<Rol> {
  private readonly permisoService = inject(PermisoService);
  protected override crudService = inject(RolService);
  override entityName = 'Rol';

  readonly permisos = signal<Permiso[]>([]);
  readonly selectedPermisos = signal<number[]>([]);

  override form = this.fb.group({
    nombrerol: [this.data?.nombrerol ?? '', Validators.required],
  });

  override loadDependencies(): void {
    this.permisoService.getAllList().subscribe((r) => {
      this.permisos.set(r);
      if (this.data) {
        this.selectedPermisos.set((this.data.Permisos || []).map((p) => p._id!));
      }
    });
  }

  togglePermiso(id: number): void {
    this.selectedPermisos.update((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
  }

  protected override buildPayload(): Record<string, unknown> {
    return {
      nombrerol: this.form.get('nombrerol')?.value ?? '',
      permisos: this.selectedPermisos(),
    };
  }
}
