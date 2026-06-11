import { ProductoPresentacion } from './producto-presentacion.interface';

export interface Producto {
  codigoprod?: number;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  idmarca?: number;
  idcategoria?: number;
  idunidad?: number;
  estado: number;
  stock_minimo?: number;
  Marca?: { nombre: string };
  Categoria?: { nombre: string };
  Unidad?: { nombre: string };
  Presentaciones?: ProductoPresentacion[];
}
