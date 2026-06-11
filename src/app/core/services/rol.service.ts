import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Rol } from '../interfaces/rol.interface';

@Injectable({ providedIn: 'root' })
export class RolService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/roles`;

  getAll(page: number = 1, limit: number = 20): Observable<{ data: Rol[]; total: number }> {
    return this.http.get<ApiResponse<Rol[]>>(`${this.apiUrl}?page=${page}&limit=${limit}`).pipe(
      map(r => ({ data: r.data, total: r.meta.total }))
    );
  }

  getAllList(): Observable<Rol[]> {
    return this.http.get<ApiResponse<Rol[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Rol> {
    return this.http.get<ApiResponse<Rol>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  create(data: { nombrerol: string; permisos?: number[] }): Observable<Rol> {
    return this.http.post<ApiResponse<Rol>>(this.apiUrl, data).pipe(map(r => r.data));
  }

  update(id: number, data: { nombrerol?: string; permisos?: number[] }): Observable<Rol> {
    return this.http.put<ApiResponse<Rol>>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(r => undefined));
  }
}
