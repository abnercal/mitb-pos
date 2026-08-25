import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Lote } from '../interfaces/lote.interface';

@Injectable({ providedIn: 'root' })
export class LoteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/lotes`;

  getAll(params?: { idsucursal?: number; codigoprod?: number; estado?: number }): Observable<Lote[]> {
    let p = new HttpParams();
    if (params?.idsucursal != null) p = p.set('idsucursal', params.idsucursal);
    if (params?.codigoprod != null) p = p.set('codigoprod', params.codigoprod);
    if (params?.estado != null) p = p.set('estado', params.estado);
    return this.http.get<ApiResponse<Lote[]>>(this.apiUrl, { params: p }).pipe(map((r) => r.data));
  }

  /** Lotes con `cantidad_disponible > 0` que vencen dentro de `dias` (default 30), ordenados soonest-first. */
  getPorVencer(dias = 30): Observable<Lote[]> {
    const p = new HttpParams().set('dias', dias);
    return this.http
      .get<ApiResponse<Lote[]>>(`${this.apiUrl}/por-vencer`, { params: p })
      .pipe(map((r) => r.data));
  }
}
