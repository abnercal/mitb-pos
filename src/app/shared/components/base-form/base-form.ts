import { Directive, DestroyRef, inject, signal, type OnInit } from '@angular/core';
import { FormBuilder, type FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type Observable } from 'rxjs';
import { BaseCrudService } from '../../../core/http/base-crud.service';

@Directive()
export abstract class BaseFormComponent<T> implements OnInit {
  readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef);
  readonly snackBar = inject(MatSnackBar);
  readonly destroyRef = inject(DestroyRef);
  readonly data: T | null = inject(MAT_DIALOG_DATA);

  abstract form: FormGroup;
  abstract entityName: string;

  /** CRUD service for this entity — injected by each child form */
  protected abstract crudService: BaseCrudService<T>;

  /** 'M' for masculine (creado/actualizado) or 'F' for feminine (creada/actualizada) */
  protected entityGender: 'M' | 'F' = 'M';

  get isEdit(): boolean {
    return this.data != null;
  }

  readonly saving = signal(false);

  ngOnInit(): void {
    this.loadDependencies();
  }

  /** Override to load reference data (tipos, categorías, etc.) */
  protected loadDependencies(): void {
    // default: no-op
  }

  /** Build the payload from form values. Override for custom payloads. */
  protected buildPayload(): Record<string, unknown> {
    const raw = (this.form.value ?? {}) as Record<string, unknown>;
    if ('estado' in raw) {
      return { ...raw, estado: raw['estado'] ? 1 : 0 };
    }
    return raw;
  }

  /** Override to customize create call */
  protected createEntity(): Observable<T> {
    return this.crudService.create(this.buildPayload() as Partial<T>);
  }

  /** Override to customize update call */
  protected updateEntity(): Observable<T> {
    return this.crudService.update((this.data as any)._id!, this.buildPayload() as Partial<T>);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const obs = this.isEdit ? this.updateEntity() : this.createEntity();

    obs.subscribe({
      next: () => {
        const suffix = this.entityGender === 'F' ? 'a' : 'o';
        this.snackBar.open(
          `${this.entityName} ${this.isEdit ? 'actualizad' : 'cread'}${suffix}`,
          'Cerrar',
          { duration: 2000 },
        );
        this.dialogRef.close(true);
      },
      error: (err) => this.onSubmitError(err),
    });
  }

  protected onSubmitError(err: unknown): void {
    this.saving.set(false);
    this.snackBar.open(`Error al guardar ${this.entityName}`, 'Cerrar', { duration: 3000 });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
