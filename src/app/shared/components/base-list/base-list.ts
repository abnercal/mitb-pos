import { Directive, DestroyRef, inject, type OnInit, signal, type Type } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfirmDeleteDialog } from '../confirm-delete-dialog';

@Directive()
export abstract class BaseListComponent<T> implements OnInit {
  readonly data = signal<T[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly loading = signal(false);

  protected readonly dialog = inject(MatDialog);
  protected readonly snackBar = inject(MatSnackBar);
  protected readonly destroyRef = inject(DestroyRef);

  abstract title: string;
  abstract entityName: string;
  abstract formComponent: Type<unknown>;
  abstract dialogWidth: string;
  abstract columns: string[];

  protected abstract loadService(page: number, limit: number, search?: string): Observable<{ data: T[]; total: number }>;
  protected abstract deleteService(id: number | string): Observable<void>;
  protected abstract getId(item: T): number | string;
  protected abstract getDisplayName(item: T): string;

  ngOnInit(): void {
    this.load();
  }

  protected buildParams(): { page: number; limit: number; search: string } {
    return {
      page: this.pageIndex() + 1,
      limit: this.pageSize(),
      search: '',
    };
  }

  load(): void {
    this.loading.set(true);
    const { page, limit, search } = this.buildParams();
    this.loadService(page, limit, search).pipe(catchError(() => {
      this.snackBar.open(`Error al cargar ${this.entityName}`, 'Cerrar', { duration: 3000 });
      return of({ data: [], total: 0 });
    })).subscribe({
      next: (res) => {
        this.data.set(res.data);
        this.totalItems.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(this.formComponent, { width: this.dialogWidth });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  openEdit(item: T): void {
    const ref = this.dialog.open(this.formComponent, { width: this.dialogWidth, data: item });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  delete(item: T): void {
    const name = this.getDisplayName(item);
    const ref = this.dialog.open(ConfirmDeleteDialog, { width: '400px', data: { name } });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      const id = this.getId(item);
      this.deleteService(id).pipe(catchError(() => {
        this.snackBar.open(`Error al eliminar ${name}`, 'Cerrar', { duration: 3000 });
        return of(undefined);
      })).subscribe(() => {
        this.snackBar.open(`${name} eliminado correctamente`, 'Cerrar', { duration: 2000 });
        this.load();
      });
    });
  }

  onPage(e: { pageIndex: number; pageSize: number }): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  onSearchChange(): void {
    this.pageIndex.set(0);
    this.load();
  }
}
