import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Sucursal } from '../interfaces/sucursal.interface';

@Injectable({ providedIn: 'root' })
export class SucursalService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/sucursales`;

  getAll(page: number = 1, limit: number = 20): Observable<{ data: Sucursal[]; total: number }> {
    return this.http.get<ApiResponse<Sucursal[]>>(`${this.apiUrl}?page=${page}&limit=${limit}`).pipe(
      map(r => ({ data: r.data, total: r.meta.total }))
    );
  }

  getAllList(): Observable<Sucursal[]> {
    return this.http.get<ApiResponse<Sucursal[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  create(data: Partial<Sucursal>): Observable<Sucursal> {
    return this.http.post<ApiResponse<Sucursal>>(this.apiUrl, data).pipe(map(r => r.data));
  }

  update(id: number, data: Partial<Sucursal>): Observable<Sucursal> {
    return this.http.put<ApiResponse<Sucursal>>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data));
  }
}
