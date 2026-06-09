import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Cliente } from '../interfaces/cliente.interface';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/clientes`;

  getAll(): Observable<Cliente[]> {
    return this.http.get<ApiResponse<Cliente[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Cliente> {
    return this.http.get<ApiResponse<Cliente>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  create(data: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<ApiResponse<Cliente>>(this.apiUrl, data).pipe(map(r => r.data));
  }

  update(id: number, data: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<ApiResponse<Cliente>>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(r => undefined));
  }
}
