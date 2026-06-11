import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { TipoPago } from '../interfaces/tipo-pago.interface';

@Injectable({ providedIn: 'root' })
export class TipoPagoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tipo-pago`;

  getAll(): Observable<TipoPago[]> {
    return this.http.get<ApiResponse<TipoPago[]>>(this.apiUrl).pipe(map(r => r.data));
  }
}
