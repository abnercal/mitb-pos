export interface InventarioItem {
  idalmacen: string;
  idsucursal: number;
  sucursal: string;
  codigoprod: number;
  producto: string;
  marca: string;
  categoria: string;
  unidad: string;
  presentaciones: {
    id: number;
    nombre: string;
    cantidad_base: number;
    precio: number;
  }[];
  stock: number;
  stock_minimo: number;
  estado: 'normal' | 'bajo' | 'sin_stock';
}
