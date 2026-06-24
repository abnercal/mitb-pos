import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseCrudService } from '../http/base-crud.service';
import { Compra } from '../interfaces/compra.interface';

@Injectable({ providedIn: 'root' })
export class CompraService extends BaseCrudService<Compra> {
  override readonly endpoint = 'compras';

  getNextCode(): Observable<{ codigo: string }> {
    return this.http.get<{ data: { codigo: string } }>(`${this.apiUrl}/next-code`).pipe(map(r => r.data));
  }

  anular(id: string): Observable<void> {
    return this.http.post<{ data: void }>(`${this.apiUrl}/anular/${id}`, {}).pipe(map(() => undefined));
  }
}
