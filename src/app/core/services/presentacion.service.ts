import { Injectable } from '@angular/core';
import { BaseCrudService } from '../http/base-crud.service';
import { Presentacion } from '../interfaces/presentacion.interface';

@Injectable({ providedIn: 'root' })
export class PresentacionService extends BaseCrudService<Presentacion> {
  override readonly endpoint = 'presentaciones';
}
