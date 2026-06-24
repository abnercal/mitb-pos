import { Injectable } from '@angular/core';
import { BaseCrudService } from '../http/base-crud.service';
import { Permiso } from '../interfaces/permiso.interface';

@Injectable({ providedIn: 'root' })
export class PermisoService extends BaseCrudService<Permiso> {
  override readonly endpoint = 'permisos';
}
