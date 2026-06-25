import { Component, OnInit, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
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
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  templateUrl: './usuarios-form.component.html',
  styles: [
    `
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        padding-top: 12px;
      }
      .password-field {
        grid-column: 1 / -1;
      }
      mat-hint {
        color: var(--mat-sys-error);
        font-size: 11px;
      }
      mat-hint.valid {
        color: var(--mat-sys-tertiary);
      }

      .image-field {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
      }
      .image-preview {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        overflow: hidden;
        background: var(--mat-sys-surface-container-high);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border: 2px dashed var(--mat-sys-outline);
        flex-shrink: 0;
      }
      .image-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .image-preview mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: var(--mat-sys-on-surface-variant);
      }
      .image-preview span {
        font-size: 10px;
        color: var(--mat-sys-on-surface-variant);
      }
    `,
  ],
})
export class UsuariosFormComponent implements OnInit {
  private readonly service = inject(UsuarioService);
  private readonly rolService = inject(RolService);
  private readonly sucursalService = inject(SucursalService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<UsuariosFormComponent>);
  private readonly dialogData = inject<Usuario | null>(MAT_DIALOG_DATA);
  private readonly snackBar = inject(MatSnackBar);

  /** Normaliza el dato: openCreate pasa null, openEdit pasa el Usuario directamente */
  get data(): { usuario: Usuario | null } {
    return { usuario: this.dialogData };
  }

  readonly roles = signal<Rol[]>([]);
  readonly sucursales = signal<Sucursal[]>([]);
  readonly saving = signal(false);
  readonly showPassword = signal(false);
  readonly previewUrl = signal<string | null>(null);

  private selectedFile: File | null = null;
  private existingImageUrl: string | null = null;

  /** Valida que la contraseña cumpla los requisitos del backend */
  get passwordValid(): boolean {
    if (!this.form.password) return false;
    return (
      this.form.password.length >= 8 &&
      /[A-Z]/.test(this.form.password) &&
      /[a-z]/.test(this.form.password) &&
      /[0-9]/.test(this.form.password)
    );
  }

  form: {
    nombre: string;
    apellido: string;
    email: string;
    username: string;
    password: string;
    codigoemp: string;
    idsucursal: number | null;
    roles: number[];
  } = {
    nombre: '',
    apellido: '',
    email: '',
    username: '',
    password: '',
    codigoemp: '',
    idsucursal: null,
    roles: [],
  };

  ngOnInit(): void {
    const session = this.authService.getSession();
    this.rolService.getAllList().subscribe((r) => this.roles.set(r));
    this.sucursalService.getAllList().subscribe((s) => {
      this.sucursales.set(s);
      // Default: sucursal del usuario logueado
      if (!this.data.usuario && session?.user.idsucursal) {
        this.form.idsucursal = session.user.idsucursal;
      }
    });

    if (this.data.usuario) {
      const u = this.data.usuario;
      this.form = {
        nombre: u.nombre,
        apellido: u.apellido || '',
        email: u.email,
        username: u.username || '',
        password: '',
        codigoemp: u.codigoemp || '',
        idsucursal: u.idsucursal || null,
        roles: (u.Roles || []).map((r) => r._id!).filter((id): id is number => id != null),
      };
      // Mostrar imagen existente si tiene
      if (u.imageUrl) {
        this.existingImageUrl = u.imageUrl;
        this.previewUrl.set(u.imageUrl);
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Validar tipo y tamaño (2MB máx)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.snackBar.open('Solo se permiten imágenes JPG, PNG o WebP', 'Cerrar', { duration: 3000 });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.snackBar.open('La imagen no debe superar los 2MB', 'Cerrar', { duration: 3000 });
      return;
    }

    this.selectedFile = file;
    // Preview local
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  async openCamera(): Promise<void> {
    const { CameraCaptureDialog } = await import('../../shared/components/camera-capture-dialog');
    const ref = this.dialog.open(CameraCaptureDialog, { width: '400px', disableClose: true });
    ref.afterClosed().subscribe((file: File | undefined) => {
      if (!file) return;
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.previewUrl.set(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  removeImage(): void {
    this.selectedFile = null;
    this.previewUrl.set(this.existingImageUrl); // vuelve a la imagen actual del servidor
  }

  private getErrorMessage(err: unknown): string {
    const apiError = err as { error?: { errors?: { msg: string }[]; message?: string } } | null;
    // Error de validación (422) con detalles de express-validator
    if (apiError?.error?.errors?.length) {
      return apiError.error.errors.map((e) => e.msg).join('. ');
    }
    // Error de negocio con mensaje
    if (apiError?.error?.message) {
      return apiError.error.message;
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

    const payload: Record<string, unknown> = {
      nombre: this.form.nombre,
      email: this.form.email,
      apellido: this.form.apellido || undefined,
      username: this.form.username || undefined,
      idsucursal: this.form.idsucursal || undefined,
      roles: this.form.roles.length ? this.form.roles : [],
    };

    // Solo enviar password si es crear o si se escribió una nueva en edición
    if (!this.data.usuario || this.form.password) {
      payload['password'] = this.form.password;
    }

    const obs = this.data.usuario
      ? this.service.updateWithImage(this.data.usuario._id!, payload, this.selectedFile)
      : this.service.createWithImage(payload, this.selectedFile);

    obs.subscribe({
      next: () => {
        this.snackBar.open(this.data.usuario ? 'Usuario actualizado' : 'Usuario creado', 'Cerrar', {
          duration: 2000,
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(this.getErrorMessage(err), 'Cerrar', { duration: 5000 });
        this.saving.set(false);
      },
    });
  }
}
