import { Injectable } from '@angular/core';
import { BaseCrudService } from '../http/base-crud.service';
import { Rol } from '../interfaces/rol.interface';

@Injectable({ providedIn: 'root' })
export class RolService extends BaseCrudService<Rol> {
  override readonly endpoint = 'roles';
}
