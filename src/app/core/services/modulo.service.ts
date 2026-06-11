import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Modulo } from '../interfaces/modulo.interface';

@Injectable({ providedIn: 'root' })
export class ModuloService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/modulos`;

  private modulos: Modulo[] = [];
  private mapa: Record<string, string | null> = {};
  private loaded = false;

  /** Carga el mapa feature→permiso (público). Retorna Observable para guards async. */
  load(): Observable<Record<string, string | null>> {
    if (this.loaded) return of(this.mapa);

    return this.http
      .get<ApiResponse<Record<string, string | null>>>(`${this.apiUrl}/public/mapa`)
      .pipe(
        tap((res) => {
          this.mapa = res.data;
          this.loaded = true;
        }),
        map((res) => res.data)
      );
  }

  /** Carga datos completos (solo superadmin). */
  loadAll(): Observable<Modulo[]> {
    return this.http.get<ApiResponse<Modulo[]>>(this.apiUrl).pipe(
      tap((res) => {
        this.modulos = res.data;
        this.loaded = true;
      }),
      map((res) => res.data)
    );
  }

  /** Actualiza permiso_nombre de un módulo (solo superadmin). */
  update(id: number, data: { permiso_nombre: string | null }): Observable<Modulo> {
    return this.http.put<ApiResponse<Modulo>>(`${this.apiUrl}/${id}`, data).pipe(
      tap((res) => {
        // Refrescar cache local
        const idx = this.modulos.findIndex((m) => m._id === id);
        if (idx !== -1) this.modulos[idx] = res.data;
        this.mapa[res.data.feature_key] = res.data.permiso_nombre;
      }),
      map((res) => res.data)
    );
  }

  /** Obtiene permiso asociado a un feature (sincrónico si ya cargó). */
  getPermiso(featureKey: string): string | null {
    return this.mapa[featureKey] ?? null;
  }

  /** Retorna todos los módulos (requiere loadAll primero). */
  getAll(): Modulo[] {
    return this.modulos;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  /** Para limpiar caché (logout). */
  clear(): void {
    this.modulos = [];
    this.mapa = {};
    this.loaded = false;
  }
}
