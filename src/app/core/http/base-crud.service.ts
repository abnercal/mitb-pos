import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../src/environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export abstract class BaseCrudService<T> {
  protected readonly http = inject(HttpClient);
  protected abstract readonly endpoint: string;

  protected get apiUrl(): string {
    return `${environment.apiUrl}/${this.endpoint}`;
  }

  getAll(page = 1, limit = 20, search = ''): Observable<{ data: T[]; total: number }> {
    const params = `?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
    return this.http.get<ApiResponse<T[]>>(`${this.apiUrl}${params}`).pipe(
      map(r => ({ data: r.data, total: (r.meta as { total?: number })?.total ?? r.data.length })),
    );
  }

  getAllList(): Observable<T[]> {
    return this.http.get<ApiResponse<T[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  getById(id: number | string): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  create(data: Partial<T>): Observable<T> {
    return this.http.post<ApiResponse<T>>(this.apiUrl, data).pipe(map(r => r.data));
  }

  update(id: number | string, data: Partial<T>): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(() => undefined));
  }
}
