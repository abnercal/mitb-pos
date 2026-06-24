import { Injectable } from '@angular/core';
import { BaseCrudService } from '../http/base-crud.service';
import { Proveedor } from '../interfaces/proveedor.interface';

@Injectable({ providedIn: 'root' })
export class ProveedorService extends BaseCrudService<Proveedor> {
  override readonly endpoint = 'proveedor';
}
