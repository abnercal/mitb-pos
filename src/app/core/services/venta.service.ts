import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseCrudService } from '../http/base-crud.service';
import { Venta } from '../interfaces/venta.interface';

export interface RegistrarPagoBody {
  importe: number;
  idtipopago: number;
  estado: string;
  fecha_pago?: string;
}

export interface ConvertirCotizacionBody {
  pago?: { idtipopago: number; estado: string };
}

@Injectable({ providedIn: 'root' })
export class VentaService extends BaseCrudService<Venta> {
  override readonly endpoint = 'ventas';

  getNextCode(): Observable<{ codigo: string }> {
    return this.http.get<{ data: { codigo: string } }>(`${this.apiUrl}/next-code`).pipe(map(r => r.data));
  }

  anular(id: string): Observable<void> {
    return this.http.post<{ data: void }>(`${this.apiUrl}/anular/${id}`, {}).pipe(map(() => undefined));
  }

  /** Convierte una Cotización en venta Confirmada: re-resuelve precios y descuenta stock. */
  convertir(id: string, body?: ConvertirCotizacionBody): Observable<Venta> {
    return this.http.post<{ data: Venta }>(`${this.apiUrl}/${id}/convertir`, body ?? {}).pipe(map(r => r.data));
  }

  /** Registra un abono/pago parcial adicional contra una venta existente. */
  registrarPago(id: string, body: RegistrarPagoBody): Observable<Venta> {
    return this.http.post<{ data: Venta }>(`${this.apiUrl}/${id}/pagos`, body).pipe(map(r => r.data));
  }

  /**
   * Marca una venta Confirmada como Entregada. Solo tiene sentido para
   * órdenes que vinieron de una Cotización convertida (ver `fecha_conversion`
   * en la interfaz Venta) — una venta creada directo en el POS ya fue
   * despachada al momento de crearse.
   */
  marcarEntregada(id: string): Observable<Venta> {
    return this.http.post<{ data: Venta }>(`${this.apiUrl}/${id}/entregar`, {}).pipe(map(r => r.data));
  }
}
