import { Component, inject, signal } from '@angular/core';

import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { type Observable } from 'rxjs';
import { UsuarioService } from '../../core/services/usuario.service';
import { RolService } from '../../core/services/rol.service';
import { SucursalService } from '../../core/services/sucursal.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/interfaces/usuario.interface';
import { Rol } from '../../core/interfaces/rol.interface';
import { Sucursal } from '../../core/interfaces/sucursal.interface';
import { BaseFormComponent } from '../../shared/components/base-form';

@Component({
  selector: 'app-usuarios-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
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
export class UsuariosFormComponent extends BaseFormComponent<Usuario> {
  private readonly usuarioService = inject(UsuarioService);
  private readonly rolService = inject(RolService);
  private readonly sucursalService = inject(SucursalService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  protected override crudService = this.usuarioService;
  override entityName = 'Usuario';

  readonly roles = signal<Rol[]>([]);
  readonly sucursales = signal<Sucursal[]>([]);
  readonly showPassword = signal(false);
  readonly previewUrl = signal<string | null>(null);

  private selectedFile: File | null = null;
  private existingImageUrl: string | null = null;

  get passwordValid(): boolean {
    const pw: string = this.form.get('password')?.value ?? '';
    if (!pw) return false;
    return pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw);
  }

  override form = this.fb.group({
    nombre: [this.data?.nombre ?? '', Validators.required],
    apellido: [this.data?.apellido ?? ''],
    email: [this.data?.email ?? '', [Validators.required, Validators.email]],
    username: [this.data?.username ?? ''],
    password: [''],
    idsucursal: [this.data?.idsucursal ?? null as number | null],
    roles: [this.data?.Roles?.map((r) => r._id!).filter((id): id is number => id != null) ?? []],
  });

  override loadDependencies(): void {
    const session = this.authService.getSession();

    this.rolService.getAllList().subscribe((r) => this.roles.set(r));
    this.sucursalService.getAllList().subscribe((s) => {
      this.sucursales.set(s);
      // Default: sucursal del usuario logueado
      if (!this.data && session?.user.idsucursal) {
        this.form.patchValue({ idsucursal: session.user.idsucursal });
      }
    });

    if (this.data?.imageUrl) {
      this.existingImageUrl = this.data.imageUrl;
      this.previewUrl.set(this.data.imageUrl);
    }
  }

  protected override buildPayload(): Record<string, unknown> {
    const raw = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      nombre: raw.nombre,
      email: raw.email,
      apellido: raw.apellido || undefined,
      username: raw.username || undefined,
      idsucursal: raw.idsucursal || undefined,
      roles: (raw.roles ?? []).filter((id: unknown): id is number => id != null),
    };
    // Solo enviar password si es crear o se escribió una nueva en edición
    if (!this.data || raw.password) {
      payload['password'] = raw.password;
    }
    return payload;
  }

  protected override createEntity(): Observable<Usuario> {
    return this.usuarioService.createWithImage(this.buildPayload(), this.selectedFile);
  }

  protected override updateEntity(): Observable<Usuario> {
    return this.usuarioService.updateWithImage(
      (this.data as Usuario)._id!,
      this.buildPayload(),
      this.selectedFile,
    );
  }

  protected override onSubmitError(err: unknown): void {
    this.saving.set(false);
    this.snackBar.open(this.getErrorMessage(err), 'Cerrar', { duration: 5000 });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.snackBar.open('Solo se permiten imágenes JPG, PNG o WebP', 'Cerrar', { duration: 3000 });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.snackBar.open('La imagen no debe superar los 2MB', 'Cerrar', { duration: 3000 });
      return;
    }

    this.selectedFile = file;
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
    this.previewUrl.set(this.existingImageUrl);
  }

  private getErrorMessage(err: unknown): string {
    const apiError = err as
      | { error?: { errors?: { msg: string }[]; message?: string } }
      | null
      | undefined;
    if (apiError?.error?.errors?.length) {
      return apiError.error.errors.map((e) => e.msg).join('. ');
    }
    if (apiError?.error?.message) {
      return apiError.error.message;
    }
    return 'Error inesperado';
  }
}
