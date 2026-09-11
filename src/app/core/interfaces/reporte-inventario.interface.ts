export interface StockDesglose {
  id: number;
  presentacion: string;
  cantidad_base: number;
  cantidad: number;
}

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
  /** Nombre de la unidad base del stock (presentación con cantidad_base === 1). Lo calcula el API. */
  stock_base?: string;
  /** Stock convertido a cada presentación. Lo calcula el API; ordenado por cantidad_base asc. */
  stock_desglose?: StockDesglose[];
  stock_minimo: number;
  estado: 'normal' | 'bajo' | 'sin_stock';
}

/** `meta` de GET /reportes/inventario: conteo por estado sobre el set filtrado. */
export interface ResumenInventario {
  total: number;
  normal: number;
  bajo: number;
  sin_stock: number;
}
