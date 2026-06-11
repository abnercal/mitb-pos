import { Rol } from './rol.interface';
import { Sucursal } from './sucursal.interface';

export interface Usuario {
  _id?: number;
  nombre: string;
  apellido?: string;
  username?: string;
  email: string;
  imagen?: string;
  imageUrl?: string;
  estado: number;
  codigoemp?: string;
  idsucursal?: number;
  Roles?: Rol[];
  Sucursal?: Sucursal;
  createdAt?: string;
  updatedAt?: string;
}
