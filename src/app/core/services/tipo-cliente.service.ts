import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { TipoClie } from '../interfaces/cliente.interface';

@Injectable({ providedIn: 'root' })
export class TipoClienteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tipocliente`;

  getAll(): Observable<TipoClie[]> {
    return this.http.get<ApiResponse<TipoClie[]>>(this.apiUrl).pipe(map(r => r.data));
  }
}
