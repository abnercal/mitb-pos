import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Venta } from '../interfaces/venta.interface';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/ventas`;

  getAll(page: number = 1, limit: number = 20, search: string = ''): Observable<{ data: Venta[]; total: number }> {
    return this.http.get<ApiResponse<Venta[]>>(`${this.apiUrl}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`).pipe(
      map(r => ({ data: r.data, total: r.meta.total }))
    );
  }

  getAllList(): Observable<Venta[]> {
    return this.http.get<ApiResponse<Venta[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  getById(id: string): Observable<Venta> {
    return this.http.get<ApiResponse<Venta>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  getNextCode(): Observable<{ codigo: string }> {
    return this.http.get<ApiResponse<{ codigo: string }>>(`${this.apiUrl}/next-code`).pipe(map(r => r.data));
  }

  create(data: any): Observable<Venta> {
    return this.http.post<ApiResponse<Venta>>(this.apiUrl, data).pipe(map(r => r.data));
  }

  anular(id: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/anular/${id}`, {}).pipe(map(r => undefined));
  }
}
