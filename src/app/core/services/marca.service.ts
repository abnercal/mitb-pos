import { Injectable } from '@angular/core';
import { BaseCrudService } from '../http/base-crud.service';
import { Marca } from '../interfaces/marca.interface';

@Injectable({ providedIn: 'root' })
export class MarcaService extends BaseCrudService<Marca> {
  override readonly endpoint = 'marcas';
}
