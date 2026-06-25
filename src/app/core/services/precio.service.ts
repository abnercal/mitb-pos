import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseCrudService } from '../http/base-crud.service';
import { Precio, PrecioConsulta } from '../interfaces/precio.interface';

@Injectable({ providedIn: 'root' })
export class PrecioService extends BaseCrudService<Precio> {
  override readonly endpoint = 'precios';

  getByPresentacion(idprodPresenta: number, idtipoCli?: number): Observable<PrecioConsulta> {
    const params: Record<string, string | number> = {};
    if (idtipoCli != null) params['idtipoCli'] = idtipoCli;
    return this.http.get<{ data: PrecioConsulta }>(`${this.apiUrl}/by-presentacion/${idprodPresenta}`, { params }).pipe(map(r => r.data));
  }

  getByProducto(codigoprod: number): Observable<Precio[]> {
    return this.http.get<{ data: Precio[] }>(`${this.apiUrl}/by-producto/${codigoprod}`).pipe(map(r => r.data));
  }
}
