export interface CompraDetalle {
  _id?: number;
  cantidad: number;
  costo: number;
  idprodPresenta: number;
  idcompra?: string;
  ProductoPresentacion?: {
    idprodPresenta: number;
    cantidad_base: number;
    Producto?: { codigoprod: number; nombre: string };
    Presentacion?: { idpresentacion: number; nombre: string };
  };
}

export interface Compra {
  _id?: string;
  nombre: string;
  fecha?: string;
  direccion?: string;
  estado: boolean;
  idproveedor?: number;
  total?: number;
  idusuario?: number;
  idsucursal?: number;
  Proveedor?: { _id: number; nombre: string };
  Sucursal?: { _id: number; nombre: string };
  Usuario?: { _id: number; nombre: string };
  Detalles?: CompraDetalle[];
  createdAt?: string;
}
