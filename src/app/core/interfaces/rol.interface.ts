import { Permiso } from './permiso.interface';

export interface Rol {
  _id?: number;
  nombrerol: string;
  Permisos?: Permiso[];
}
