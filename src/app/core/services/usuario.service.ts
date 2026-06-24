import { Injectable } from '@angular/core';
import { BaseCrudService } from '../http/base-crud.service';
import { Usuario } from '../interfaces/usuario.interface';

@Injectable({ providedIn: 'root' })
export class UsuarioService extends BaseCrudService<Usuario> {
  override readonly endpoint = 'usuarios';
}
