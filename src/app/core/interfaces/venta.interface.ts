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

export interface VentaEstado {
  idestado: number;
  nombre: string;
  descripcion: string;
}

export interface Venta {
  _id?: string;
  nombre: string;
  referencia?: string;
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
  /** Crea la venta como Cotización (no descuenta inventario ni crea Pago). Default false. */
  esCotizacion?: boolean;
  /** Fija el tipo de precio para esta venta puntual, independiente del Cliente asociado. */
  idTipoCliVenta?: number | null;
  fecha_limite_pago?: string | null;
  /** total - suma de Pagos.importe, calculado por el servidor. */
  saldoPendiente?: number;
  /** Abonos/pagos parciales registrados contra esta venta (junto al Pago singular preexistente). */
  Pagos?: Array<{
    idpagos: number;
    importe: number;
    idtipopago: number;
    estado: string;
    fecha_pago: string;
  }>;
  /** Estado resuelto de la orden. Los nombres son fijos: Cotizacion | Confirmada | Entregada | Anulada. */
  Estado?: VentaEstado | null;
  /** Presente solo si esta orden pasó por Cotización y fue convertida. Habilita "Marcar como entregada". */
  fecha_conversion?: string | null;
}
