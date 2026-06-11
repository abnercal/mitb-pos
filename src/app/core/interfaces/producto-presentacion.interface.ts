export interface ProductoPresentacion {
  idprodPresenta?: number;
  codigoprod: number;
  idpresentacion: number;
  cantidad_base: number;
  precio_venta: number;
  codigo_barras?: string;
  estado: number;
  Presentacion?: { nombre: string };
}

export interface PresentacionForm {
  idpresentacion: number | null;
  cantidad_base: number;
  precio_venta: number;
  codigo_barras: string;
  _tempId?: string; // solo para el track en el formulario
}
