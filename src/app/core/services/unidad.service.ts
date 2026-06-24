import { Injectable } from '@angular/core';
import { BaseCrudService } from '../http/base-crud.service';
import { Unidad } from '../interfaces/unidad.interface';

@Injectable({ providedIn: 'root' })
export class UnidadService extends BaseCrudService<Unidad> {
  override readonly endpoint = 'unidades';
}
