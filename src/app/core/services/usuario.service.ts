import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Usuario } from '../interfaces/usuario.interface';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  getAll(page: number = 1, limit: number = 20, search: string = ''): Observable<{ data: Usuario[]; total: number }> {
    return this.http.get<ApiResponse<Usuario[]>>(`${this.apiUrl}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`).pipe(
      map(r => ({ data: r.data, total: r.meta.total }))
    );
  }

  getAllList(): Observable<Usuario[]> {
    return this.http.get<ApiResponse<Usuario[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Usuario> {
    return this.http.get<ApiResponse<Usuario>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  create(data: Partial<Usuario> & { password: string; roles?: number[] }): Observable<Usuario> {
    return this.http.post<ApiResponse<Usuario>>(this.apiUrl, data).pipe(map(r => r.data));
  }

  update(id: number, data: Partial<Usuario> & { password?: string; roles?: number[] }): Observable<Usuario> {
    return this.http.put<ApiResponse<Usuario>>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(r => undefined));
  }
}
