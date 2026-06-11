import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Permiso } from '../interfaces/permiso.interface';

@Injectable({ providedIn: 'root' })
export class PermisoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/permisos`;

  getAll(page: number = 1, limit: number = 20): Observable<{ data: Permiso[]; total: number }> {
    return this.http.get<ApiResponse<Permiso[]>>(`${this.apiUrl}?page=${page}&limit=${limit}`).pipe(
      map(r => ({ data: r.data, total: r.meta.total }))
    );
  }

  getAllList(): Observable<Permiso[]> {
    return this.http.get<ApiResponse<Permiso[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Permiso> {
    return this.http.get<ApiResponse<Permiso>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  create(data: { nombre: string }): Observable<Permiso> {
    return this.http.post<ApiResponse<Permiso>>(this.apiUrl, data).pipe(map(r => r.data));
  }

  update(id: number, data: { nombre: string }): Observable<Permiso> {
    return this.http.put<ApiResponse<Permiso>>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(r => undefined));
  }
}
