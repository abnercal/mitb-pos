export interface VentaDetalle {
  _id?: number;
  cantidad: number;
  precio: number;
  codigoprod: number;
  idorden?: string;
  Producto?: { codigoprod: number; nombre: string };
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
  idusuario?: number;
  idsucursal?: number;
  Cliente?: { _id: number; nombres: string; apellidos?: string };
  Detalles?: VentaDetalle[];
  Pago?: VentaPago;
  createdAt?: string;
}
