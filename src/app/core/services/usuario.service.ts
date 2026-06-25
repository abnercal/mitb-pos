import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BaseCrudService } from '../http/base-crud.service';
import { Usuario } from '../interfaces/usuario.interface';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable({ providedIn: 'root' })
export class UsuarioService extends BaseCrudService<Usuario> {
  override readonly endpoint = 'usuarios';
  private readonly httpClient = inject(HttpClient);

  /**
   * Convierte un objeto plano + archivo opcional a FormData para enviar como multipart.
   * El backend espera multipart porque tiene multer middleware para la imagen.
   */
  private toFormData(data: Record<string, unknown>, file?: File | null): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) continue;
      if (key === 'roles' && Array.isArray(value)) {
        // multer no entiende arrays JSON, mandamos como string serializado
        fd.append(key, JSON.stringify(value));
      } else {
        fd.append(key, String(value));
      }
    }
    if (file) fd.append('imagen', file);
    return fd;
  }

  createWithImage(data: Record<string, unknown>, file?: File | null): Observable<Usuario> {
    const fd = this.toFormData(data, file);
    return this.httpClient.post<ApiResponse<Usuario>>(this.apiUrl, fd).pipe(map(r => r.data));
  }

  updateWithImage(id: number | string, data: Record<string, unknown>, file?: File | null): Observable<Usuario> {
    const fd = this.toFormData(data, file);
    // Para update, el campo imagen se manda como string vacío si se quiere borrar, o se omite si no cambia
    return this.httpClient.put<ApiResponse<Usuario>>(`${this.apiUrl}/${id}`, fd).pipe(map(r => r.data));
  }
}
