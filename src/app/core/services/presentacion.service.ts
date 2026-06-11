import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Presentacion } from '../interfaces/presentacion.interface';

@Injectable({ providedIn: 'root' })
export class PresentacionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/presentaciones`;

  getAll(page: number = 1, limit: number = 20): Observable<{ data: Presentacion[]; total: number }> {
    return this.http.get<ApiResponse<Presentacion[]>>(`${this.apiUrl}?page=${page}&limit=${limit}`).pipe(
      map(r => ({ data: r.data, total: r.meta.total }))
    );
  }

  getAllList(): Observable<Presentacion[]> {
    return this.http.get<ApiResponse<Presentacion[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Presentacion> {
    return this.http.get<ApiResponse<Presentacion>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  create(data: Partial<Presentacion>): Observable<Presentacion> {
    return this.http.post<ApiResponse<Presentacion>>(this.apiUrl, data).pipe(map(r => r.data));
  }

  update(id: number, data: Partial<Presentacion>): Observable<Presentacion> {
    return this.http.put<ApiResponse<Presentacion>>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(r => undefined));
  }
}
