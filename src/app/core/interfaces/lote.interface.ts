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
