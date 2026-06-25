import { Directive, DestroyRef, inject, type OnInit } from '@angular/core';
import { FormBuilder, type FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type Observable } from 'rxjs';

@Directive()
export abstract class BaseFormComponent<T> implements OnInit {
  protected readonly fb = inject(FormBuilder);
  protected readonly dialogRef = inject(MatDialogRef<unknown>);
  protected readonly snackBar = inject(MatSnackBar);
  protected readonly destroyRef = inject(DestroyRef);

  abstract form: FormGroup;
  protected abstract isEdit: boolean;
  protected abstract entityName: string;

  ngOnInit(): void {
    this.loadDependencies();
  }

  protected abstract loadDependencies(): void;
  protected abstract createEntity(): Observable<T>;
  protected abstract updateEntity(): Observable<T>;

  submit(): void {
    if (this.form.invalid) return;

    const obs = this.isEdit ? this.updateEntity() : this.createEntity();

    obs.subscribe({
      next: () => {
        const action = this.isEdit ? 'actualizad' : 'cread';
        this.snackBar.open(`${this.entityName} ${action}o correctamente`, 'Cerrar', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackBar.open(`Error al guardar ${this.entityName}`, 'Cerrar', { duration: 3000 });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
