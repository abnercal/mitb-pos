import { Injectable } from '@angular/core';
import { BaseCrudService } from '../http/base-crud.service';
import { Sucursal } from '../interfaces/sucursal.interface';

@Injectable({ providedIn: 'root' })
export class SucursalService extends BaseCrudService<Sucursal> {
  override readonly endpoint = 'sucursales';
}
