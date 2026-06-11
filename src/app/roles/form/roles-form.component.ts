import { Component, OnInit, inject, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RolService } from '../../core/services/rol.service';
import { PermisoService } from '../../core/services/permiso.service';
import { Rol } from '../../core/interfaces/rol.interface';
import { Permiso } from '../../core/interfaces/permiso.interface';

@Component({
  selector: 'app-roles-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatCheckboxModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>{{ data.rol ? 'Editar rol' : 'Nuevo rol' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nombre del rol *</mat-label>
        <input matInput [(ngModel)]="nombrerol" required>
      </mat-form-field>

      <h3 class="perm-title">Permisos</h3>
      <div class="perm-grid">
        <label class="perm-item" *ngFor="let p of permisos()">
          <mat-checkbox [checked]="selectedPermisos().includes(p._id!)"
                        (change)="togglePermiso(p._id!)"></mat-checkbox>
          <span>{{ p.nombre }}</span>
        </label>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="saving() || !nombrerol" (click)="save()">
        {{ saving() ? 'Guardando…' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 12px; }
    .perm-title { font-size: 16px; font-weight: 500; margin: 16px 0 8px; }
    .perm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 300px; overflow-y: auto; }
    .perm-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer; font-size: 14px; }
  `],
})
export class RolesFormComponent implements OnInit {
  private readonly service = inject(RolService);
  private readonly permisoService = inject(PermisoService);
  private readonly dialogRef = inject(MatDialogRef<RolesFormComponent>);
  readonly data: { rol: Rol | null } = inject(MAT_DIALOG_DATA);
  private readonly snackBar = inject(MatSnackBar);

  readonly permisos = signal<Permiso[]>([]);
  readonly selectedPermisos = signal<number[]>([]);
  readonly saving = signal(false);

  nombrerol = '';

  ngOnInit(): void {
    this.permisoService.getAllList().subscribe(r => this.permisos.set(r));
    if (this.data.rol) {
      this.nombrerol = this.data.rol.nombrerol;
      this.selectedPermisos.set((this.data.rol.Permisos || []).map(p => p._id!));
    }
  }

  togglePermiso(id: number): void {
    this.selectedPermisos.update(list =>
      list.includes(id) ? list.filter(x => x !== id) : [...list, id]
    );
  }

  save(): void {
    this.saving.set(true);
    const payload = { nombrerol: this.nombrerol, permisos: this.selectedPermisos() };
    if (this.data.rol) {
      this.service.update(this.data.rol._id!, payload).subscribe({
        next: () => { this.snackBar.open('Rol actualizado', 'Cerrar', { duration: 2000 }); this.dialogRef.close(true); },
        error: () => { this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 }); this.saving.set(false); },
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => { this.snackBar.open('Rol creado', 'Cerrar', { duration: 2000 }); this.dialogRef.close(true); },
        error: () => { this.snackBar.open('Error al crear rol', 'Cerrar', { duration: 3000 }); this.saving.set(false); },
      });
    }
  }
}
