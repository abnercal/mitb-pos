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

  getAll(): Observable<Compra[]> {
    return this.http.get<ApiResponse<Compra[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  getById(id: string): Observable<Compra> {
    return this.http.get<ApiResponse<Compra>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  create(data: any): Observable<Compra> {
    return this.http.post<ApiResponse<Compra>>(this.apiUrl, data).pipe(map(r => r.data));
  }

  anular(id: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/anular/${id}`, {}).pipe(map(r => undefined));
  }
}
