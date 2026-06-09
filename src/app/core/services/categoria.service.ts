import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Categoria } from '../interfaces/categoria.interface';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/categorias`;

  getAll(): Observable<Categoria[]> {
    return this.http.get<ApiResponse<Categoria[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Categoria> {
    return this.http.get<ApiResponse<Categoria>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  create(data: Partial<Categoria>): Observable<Categoria> {
    return this.http.post<ApiResponse<Categoria>>(this.apiUrl, data).pipe(map(r => r.data));
  }

  update(id: number, data: Partial<Categoria>): Observable<Categoria> {
    return this.http.put<ApiResponse<Categoria>>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(r => undefined));
  }
}
