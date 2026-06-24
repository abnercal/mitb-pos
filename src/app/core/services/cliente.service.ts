import { Injectable } from '@angular/core';
import { BaseCrudService } from '../http/base-crud.service';
import { Cliente } from '../interfaces/cliente.interface';

@Injectable({ providedIn: 'root' })
export class ClienteService extends BaseCrudService<Cliente> {
  override readonly endpoint = 'clientes';
}
