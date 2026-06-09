export interface Producto {
  codigoprod?: number;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  idmarca?: number;
  idpresentacion?: number;
  idcategoria?: number;
  idunidad?: number;
  precio?: number;
  estado: number;
  Marca?: { nombre: string };
  Presentacion?: { nombre: string };
  Categoria?: { nombre: string };
  Unidad?: { nombre: string };
}
