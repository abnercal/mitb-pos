import { Injectable } from '@angular/core';

export interface AppConfig {
  appName: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  taxName: string;
  taxRate: number;
  companyName: string;
  companyNit: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  primaryColor: string;
  accentColor: string;
}

const DEFAULT_CONFIG: AppConfig = {
  appName: 'MITB POS',
  currency: 'GTQ',
  currencySymbol: 'Q',
  locale: 'es-GT',
  taxName: 'IVA',
  taxRate: 0.12,
  companyName: 'Mi Empresa',
  companyNit: 'CF',
  companyAddress: 'Dirección',
  companyPhone: '00000000',
  companyEmail: 'info@miempresa.com',
  primaryColor: '#1565c0',
  accentColor: '#ff8f00',
};

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config: AppConfig = { ...DEFAULT_CONFIG };

  constructor() {
    this.loadFromStorage();
  }

  get(): AppConfig {
    return this.config;
  }

  update(partial: Partial<AppConfig>): void {
    this.config = { ...this.config, ...partial };
    localStorage.setItem('app_config', JSON.stringify(this.config));
  }

  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
    localStorage.removeItem('app_config');
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('app_config');
    if (stored) {
      this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  }
}
