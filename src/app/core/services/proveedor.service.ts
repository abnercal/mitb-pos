import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Proveedor } from '../interfaces/proveedor.interface';

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/proveedor`; // singular en backend

  getAll(page: number = 1, limit: number = 20, search: string = ''): Observable<{ data: Proveedor[]; total: number }> {
    return this.http.get<ApiResponse<Proveedor[]>>(`${this.apiUrl}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`).pipe(
      map(r => ({ data: r.data, total: r.meta.total }))
    );
  }

  getAllList(): Observable<Proveedor[]> {
    return this.http.get<ApiResponse<Proveedor[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Proveedor> {
    return this.http.get<ApiResponse<Proveedor>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  create(data: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.post<ApiResponse<Proveedor>>(this.apiUrl, data).pipe(map(r => r.data));
  }

  update(id: number, data: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.put<ApiResponse<Proveedor>>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(r => undefined));
  }
}
