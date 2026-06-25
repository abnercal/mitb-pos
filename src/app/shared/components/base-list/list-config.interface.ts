import { type Type } from '@angular/core';
import { type Observable } from 'rxjs';

export interface ColumnConfig<T> {
  key: string;
  header: string;
  cell: (item: T) => string;
  sortable?: boolean;
}

export interface DeleteState {
  show: boolean;
  name: string;
  id: number | string;
}

export interface ListConfig<T> {
  title: string;
  createLabel: string;
  emptyIcon: string;
  emptyMessage: string;
  dialogWidth: string;
  formComponent: Type<unknown>;
  service: {
    getAll: (page: number, limit: number, search?: string) => Observable<{ data: T[]; total: number }>;
    delete: (id: number | string) => Observable<void>;
  };
  idField: keyof T;
  displayField: keyof T;
  deleteConfirmKey?: string;
  search: boolean;
  searchPlaceholder: string;
  columns: ColumnConfig<T>[];
}
