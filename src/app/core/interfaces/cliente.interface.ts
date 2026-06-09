export interface TipoClie {
  idtipoCli: number;
  nombre: string;
}

export interface Cliente {
  _id?: number;
  nit?: string;
  nombres: string;
  apellidos?: string;
  direccion?: string;
  email?: string;
  telefono?: string;
  estado: number;
  idtipoCli: number;
  tipoClie?: TipoClie;
}
