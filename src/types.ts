export interface InventoryItem {
  id: string;
  cta: string;
  placa: string;
  descripcion: string;
  marca: string;
  modelo: string;
  serie: string;
  fecha: string;
  valorAdquisicion: number;
  depreciacion: number;
  valorReal: number;
  ubicacion: string;
  estadoCarga?: 'ubicado' | 'no-ubicado' | 'sustentado';
  updatedAt?: any;
}

export interface AdminUser {
  uid: string;
  email: string;
}
