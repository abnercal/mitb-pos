export interface VentaDetalle {
  _id?: number;
  cantidad: number;
  precio: number;
  idprodPresenta: number;
  idorden?: string;
  ProductoPresentacion?: {
    idprodPresenta: number;
    cantidad_base: number;
    precio_venta: number;
    Producto?: { codigoprod: number; nombre: string };
    Presentacion?: { idpresentacion: number; nombre: string };
  };
}

export interface VentaPago {
  _id?: number;
  idtipopago?: number;
  importe?: number;
  estado?: string;
}

export interface Venta {
  _id?: string;
  nombre: string;
  fecha?: string;
  direccion?: string;
  idcliente?: number;
  idestado?: number;
  total?: number;
  total_orden?: number;
  idusuario?: number;
  idsucursal?: number;
  Sucursal?: { _id: number; nombre: string };
  Cliente?: { _id: number; nombres: string; apellidos?: string };
  Detalles?: VentaDetalle[];
  detalles?: VentaDetalle[];
  Pago?: VentaPago;
  pago?: VentaPago;
  createdAt?: string;
}
