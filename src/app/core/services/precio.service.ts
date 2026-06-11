import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Precio, PrecioConsulta } from '../interfaces/precio.interface';
import { ApiResponse } from '../interfaces/api-response.interface';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PrecioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/precios`;

  getAll(filtros?: { idprodPresenta?: number }): Observable<Precio[]> {
    let params: any = {};
    if (filtros?.idprodPresenta) params.idprodPresenta = filtros.idprodPresenta;
    return this.http.get<ApiResponse<Precio[]>>(this.apiUrl, { params }).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Precio> {
    return this.http.get<ApiResponse<Precio>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  getByPresentacion(idprodPresenta: number, idtipoCli?: number): Observable<PrecioConsulta> {
    let params: any = {};
    if (idtipoCli != null) params.idtipoCli = idtipoCli;
    return this.http.get<ApiResponse<PrecioConsulta>>(`${this.apiUrl}/by-presentacion/${idprodPresenta}`, { params })
      .pipe(map(r => r.data));
  }

  create(data: Partial<Precio>): Observable<Precio> {
    return this.http.post<ApiResponse<Precio>>(this.apiUrl, data).pipe(map(r => r.data));
  }

  update(id: number, data: Partial<Precio>): Observable<Precio> {
    return this.http.put<ApiResponse<Precio>>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  getByProducto(codigoprod: number): Observable<Precio[]> {
    return this.http
      .get<ApiResponse<Precio[]>>(`${this.apiUrl}/by-producto/${codigoprod}`)
      .pipe(map(r => r.data));
  }
}
