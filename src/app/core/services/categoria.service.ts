import { Injectable } from '@angular/core';
import { BaseCrudService } from '../http/base-crud.service';
import { Categoria } from '../interfaces/categoria.interface';

@Injectable({ providedIn: 'root' })
export class CategoriaService extends BaseCrudService<Categoria> {
  override readonly endpoint = 'categorias';
}
