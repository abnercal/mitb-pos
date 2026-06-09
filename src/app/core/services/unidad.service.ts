import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Unidad } from '../interfaces/unidad.interface';

@Injectable({ providedIn: 'root' })
export class UnidadService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/unidades`;

  getAll(): Observable<Unidad[]> {
    return this.http.get<ApiResponse<Unidad[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Unidad> {
    return this.http.get<ApiResponse<Unidad>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  create(data: Partial<Unidad>): Observable<Unidad> {
    return this.http.post<ApiResponse<Unidad>>(this.apiUrl, data).pipe(map(r => r.data));
  }

  update(id: number, data: Partial<Unidad>): Observable<Unidad> {
    return this.http.put<ApiResponse<Unidad>>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(r => undefined));
  }
}
