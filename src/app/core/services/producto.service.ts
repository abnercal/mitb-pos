import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Producto } from '../interfaces/producto.interface';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/productos`;

  getAll(page: number = 1, limit: number = 20, search: string = ''): Observable<{ data: Producto[]; total: number }> {
    return this.http.get<ApiResponse<Producto[]>>(`${this.apiUrl}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`).pipe(
      map(r => ({ data: r.data, total: r.meta.total }))
    );
  }

  getAllList(): Observable<Producto[]> {
    return this.http.get<ApiResponse<Producto[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Producto> {
    return this.http.get<ApiResponse<Producto>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  create(data: FormData | Partial<Producto>): Observable<Producto> {
    const body = data instanceof FormData ? data : data;
    return this.http.post<ApiResponse<Producto>>(this.apiUrl, body).pipe(map(r => r.data));
  }

  update(id: number, data: FormData | Partial<Producto>): Observable<Producto> {
    return this.http.put<ApiResponse<Producto>>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(r => undefined));
  }
}
