import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { UsuarioService } from '../../core/services/usuario.service';
import { RolService } from '../../core/services/rol.service';
import { SucursalService } from '../../core/services/sucursal.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/interfaces/usuario.interface';
import { Rol } from '../../core/interfaces/rol.interface';
import { Sucursal } from '../../core/interfaces/sucursal.interface';

@Component({
  selector: 'app-usuarios-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatSelectModule, MatSnackBarModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.usuario ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
    <mat-dialog-content>
      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Nombre *</mat-label>
          <input matInput [(ngModel)]="form.nombre" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Apellido</mat-label>
          <input matInput [(ngModel)]="form.apellido">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Email *</mat-label>
          <input matInput type="email" [(ngModel)]="form.email" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Username</mat-label>
          <input matInput [(ngModel)]="form.username">
        </mat-form-field>

        <!-- Password con ojo -->
        <mat-form-field appearance="outline" class="password-field">
          <mat-label>{{ data.usuario ? 'Nueva contraseña' : 'Contraseña *' }}</mat-label>
          <input matInput [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="form.password">
          <button mat-icon-button matSuffix (click)="showPassword.set(!showPassword())" type="button" [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
            <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-hint *ngIf="!data.usuario || form.password" [class.valid]="passwordValid">
            Mín. 8 carac. — Al menos 1 mayúscula, 1 minúscula y 1 número
          </mat-hint>
        </mat-form-field>

        <!-- Código empleado: auto-generado en crear, solo lectura en editar -->
        <mat-form-field appearance="outline" *ngIf="data.usuario">
          <mat-label>Código empleado</mat-label>
          <input matInput [value]="data.usuario.codigoemp || ''" readonly>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Sucursal *</mat-label>
          <mat-select [(ngModel)]="form.idsucursal" required>
            <mat-option *ngFor="let s of sucursales()" [value]="s.idsucursal">{{ s.nombre }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Roles</mat-label>
          <mat-select [(ngModel)]="form.roles" multiple>
            <mat-option *ngFor="let r of roles()" [value]="r._id">{{ r.nombrerol }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="saving()" (click)="save()">
        {{ saving() ? 'Guardando…' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 12px; }
    .password-field { grid-column: 1 / -1; }
    mat-hint { color: #e53935; font-size: 11px; }
    mat-hint.valid { color: #43a047; }
  `],
})
export class UsuariosFormComponent implements OnInit {
  private readonly service = inject(UsuarioService);
  private readonly rolService = inject(RolService);
  private readonly sucursalService = inject(SucursalService);
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<UsuariosFormComponent>);
  readonly data: { usuario: Usuario | null } = inject(MAT_DIALOG_DATA);
  private readonly snackBar = inject(MatSnackBar);

  readonly roles = signal<Rol[]>([]);
  readonly sucursales = signal<Sucursal[]>([]);
  readonly saving = signal(false);
  readonly showPassword = signal(false);

  /** Valida que la contraseña cumpla los requisitos del backend */
  get passwordValid(): boolean {
    if (!this.form.password) return false;
    return this.form.password.length >= 8 &&
           /[A-Z]/.test(this.form.password) &&
           /[a-z]/.test(this.form.password) &&
           /[0-9]/.test(this.form.password);
  }

  form: any = { nombre: '', apellido: '', email: '', username: '', password: '', codigoemp: '', idsucursal: null, roles: [] };

  ngOnInit(): void {
    const session = this.authService.getSession();
    this.rolService.getAllList().subscribe(r => this.roles.set(r));
    this.sucursalService.getAllList().subscribe(s => {
      this.sucursales.set(s);
      // Default: sucursal del usuario logueado
      if (!this.data.usuario && session?.user.idsucursal) {
        this.form.idsucursal = session.user.idsucursal;
      }
    });

    if (this.data.usuario) {
      const u = this.data.usuario;
      this.form = {
        nombre: u.nombre, apellido: u.apellido || '', email: u.email,
        username: u.username || '', password: '', codigoemp: u.codigoemp || '',
        idsucursal: u.idsucursal || null,
        roles: (u.Roles || []).map(r => r._id),
      };
    }
  }

  private getErrorMessage(err: any): string {
    // Error de validación (422) con detalles de express-validator
    if (err?.error?.errors?.length) {
      return err.error.errors.map((e: any) => e.msg).join('. ');
    }
    // Error de negocio con mensaje
    if (err?.error?.message) {
      return err.error.message;
    }
    return 'Error inesperado';
  }

  save(): void {
    if (!this.form.nombre || !this.form.email) return;
    if (!this.data.usuario && !this.passwordValid) {
      this.snackBar.open('La contraseña no cumple los requisitos', 'Cerrar', { duration: 4000 });
      return;
    }
    this.saving.set(true);
    const payload = {
      ...this.form,
      codigoemp: undefined, // nunca se envía — el backend lo genera
      roles: this.form.roles.length ? this.form.roles : undefined,
      idsucursal: this.form.idsucursal || undefined,
    };
    if (this.data.usuario) {
      if (!payload.password) delete payload.password;
      this.service.update(this.data.usuario._id!, payload).subscribe({
        next: () => { this.snackBar.open('Usuario actualizado', 'Cerrar', { duration: 2000 }); this.dialogRef.close(true); },
        error: (err) => { this.snackBar.open(this.getErrorMessage(err), 'Cerrar', { duration: 5000 }); this.saving.set(false); },
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => { this.snackBar.open('Usuario creado', 'Cerrar', { duration: 2000 }); this.dialogRef.close(true); },
        error: (err) => { this.snackBar.open(this.getErrorMessage(err), 'Cerrar', { duration: 5000 }); this.saving.set(false); },
      });
    }
  }
}
