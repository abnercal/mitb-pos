import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { InventarioItem } from '../interfaces/reporte-inventario.interface';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reportes`;

  getInventario(params?: {
    sucursal?: number;
    estado?: string;
    search?: string;
  }): Observable<InventarioItem[]> {
    let p = new HttpParams();
    if (params?.sucursal) p = p.set('sucursal', params.sucursal);
    if (params?.estado) p = p.set('estado', params.estado);
    if (params?.search) p = p.set('search', params.search);
    return this.http
      .get<ApiResponse<InventarioItem[]>>(`${this.apiUrl}/inventario`, { params: p })
      .pipe(map((r) => r.data));
  }
}
