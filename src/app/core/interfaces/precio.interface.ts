export interface Precio {
  idprecios?: number;
  precio: number;
  // Legacy: columna del backend que no participa en obtenerPrecioCorrecto()
  // (el precio se resuelve por idtipoCli). Ya no se edita desde el form de
  // productos — sólo queda opcional acá para no romper el tipado de precios
  // ya existentes que la traen del backend.
  tipoprecio?: string;         // "regular" | "mayorista" | "especial"
  fechaefecto?: string;
  fechafin?: string;
  idprodPresenta: number;
  idtipoCli: number;
  estado?: number; // 1 = activo, 0 = inactivo (soft-delete)
  TipoCliente?: { idtipoCli: number; nombre: string };
}

export interface PrecioConsulta {
  precio: number;
  tipoprecio?: string;
  fuente: string;  // "precio_especifico" | "precio_venta"
}
