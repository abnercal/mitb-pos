import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseCrudService } from '../http/base-crud.service';
import { Venta } from '../interfaces/venta.interface';

@Injectable({ providedIn: 'root' })
export class VentaService extends BaseCrudService<Venta> {
  override readonly endpoint = 'ventas';

  getNextCode(): Observable<{ codigo: string }> {
    return this.http.get<{ data: { codigo: string } }>(`${this.apiUrl}/next-code`).pipe(map(r => r.data));
  }

  anular(id: string): Observable<void> {
    return this.http.post<{ data: void }>(`${this.apiUrl}/anular/${id}`, {}).pipe(map(() => undefined));
  }
}
