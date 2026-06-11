export interface Precio {
  idprecios?: number;
  precio: number;
  tipoprecio: string;         // "regular" | "mayorista" | "especial"
  fechaefecto?: string;
  fechafin?: string;
  idprodPresenta: number;
  idtipoCli: number;
  TipoCliente?: { idtipoCli: number; nombre: string };
}

export interface PrecioConsulta {
  precio: number;
  tipoprecio?: string;
  fuente: string;  // "precio_especifico" | "precio_venta"
}
