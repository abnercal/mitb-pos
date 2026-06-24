import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseCrudService } from '../http/base-crud.service';
import { Producto } from '../interfaces/producto.interface';

@Injectable({ providedIn: 'root' })
export class ProductoService extends BaseCrudService<Producto> {
  override readonly endpoint = 'productos';

  override create(data: FormData | Partial<Producto>): Observable<Producto> {
    return this.http.post<{ data: Producto }>(this.apiUrl, data).pipe(map(r => r.data));
  }

  override update(id: number, data: FormData | Partial<Producto>): Observable<Producto> {
    return this.http.put<{ data: Producto }>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data));
  }
}
