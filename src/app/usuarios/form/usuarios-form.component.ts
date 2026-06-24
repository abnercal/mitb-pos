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
  templateUrl: './usuarios-form.component.html',
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
