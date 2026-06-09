import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Marca } from '../interfaces/marca.interface';

@Injectable({ providedIn: 'root' })
export class MarcaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/marcas`;

  getAll(): Observable<Marca[]> {
    return this.http.get<ApiResponse<Marca[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Marca> {
    return this.http.get<ApiResponse<Marca>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  create(data: Partial<Marca>): Observable<Marca> {
    return this.http.post<ApiResponse<Marca>>(this.apiUrl, data).pipe(map(r => r.data));
  }

  update(id: number, data: Partial<Marca>): Observable<Marca> {
    return this.http.put<ApiResponse<Marca>>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(r => undefined));
  }
}
