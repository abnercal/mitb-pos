export interface Lote {
  idlote: string;
  cantidad_inicial: number;
  cantidad_disponible: number;
  fecha_ingreso: string;
  fecha_vencimiento: string;
  estado: number;
  codigoprod: number;
  idsucursal: number;
  idcompra_detalle: number;
  Producto?: { codigoprod: number; nombre: string };
  Sucursal?: { _id: number; nombre: string };
}

export type UrgenciaLote = 'vencido' | 'critico' | 'proximo';

/** Fila aplanada de GET /lotes/por-vencer. Incluye lotes ya vencidos con stock. */
export interface LotePorVencer {
  idlote: string;
  codigoprod: number;
  producto: string;
  marca: string;
  unidad: string;
  idsucursal: number;
  sucursal: string;
  cantidad_inicial: number;
  cantidad_disponible: number;
  fecha_ingreso: string;
  fecha_vencimiento: string;
  /** Días hasta el vencimiento. Negativo = ya vencido. Lo calcula el API. */
  dias_restantes: number;
  urgencia: UrgenciaLote;
}

/** `meta` de GET /lotes/por-vencer. */
export interface ResumenPorVencer {
  total: number;
  dias: number;
  vencido: number;
  critico: number;
  proximo: number;
}
