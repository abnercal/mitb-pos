export interface CompraDetalle {
  _id?: number;
  cantidad: number;
  costo: number;
  idprodPresenta: number;
  idcompra?: string;
  fecha_vencimiento?: string | null;
  ProductoPresentacion?: {
    idprodPresenta: number;
    cantidad_base: number;
    Producto?: { codigoprod: number; nombre: string; controla_vencimiento?: boolean };
    Presentacion?: { idpresentacion: number; nombre: string };
  };
}

export interface CompraPago {
  idpagos_compra: number;
  importe: number;
  idtipopago: number;
  estado: string;
  fecha_pago: string;
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
  fecha_limite_pago?: string | null;
  saldoPendiente?: number;
  Pagos?: CompraPago[];
  Proveedor?: { _id: number; nombre: string };
  Sucursal?: { _id: number; nombre: string };
  Usuario?: { _id: number; nombre: string };
  Detalles?: CompraDetalle[];
  detalles?: CompraDetalle[];
  createdAt?: string;
}
