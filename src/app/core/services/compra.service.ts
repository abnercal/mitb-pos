import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Compra } from '../interfaces/compra.interface';

@Injectable({ providedIn: 'root' })
export class CompraService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/compras`;

  getAll(page: number = 1, limit: number = 20, search: string = ''): Observable<{ data: Compra[]; total: number }> {
    return this.http.get<ApiResponse<Compra[]>>(`${this.apiUrl}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`).pipe(
      map(r => ({ data: r.data, total: r.meta.total }))
    );
  }

  getAllList(): Observable<Compra[]> {
    return this.http.get<ApiResponse<Compra[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  getById(id: string): Observable<Compra> {
    return this.http.get<ApiResponse<Compra>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  getNextCode(): Observable<{ codigo: string }> {
    return this.http.get<ApiResponse<{ codigo: string }>>(`${this.apiUrl}/next-code`).pipe(map(r => r.data));
  }

  create(data: any): Observable<Compra> {
    return this.http.post<ApiResponse<Compra>>(this.apiUrl, data).pipe(map(r => r.data));
  }

  anular(id: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/anular/${id}`, {}).pipe(map(r => undefined));
  }
}
