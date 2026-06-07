import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ConfigService, AppConfig } from '../core/services/config.service';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="config-page">
      <h1 class="page-title">Configuración del sistema</h1>

      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>business</mat-icon>
          <mat-card-title>Empresa</mat-card-title>
          <mat-card-subtitle>Datos de tu empresa/comercio</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="config-grid">
            <mat-form-field appearance="outline">
              <mat-label>Nombre de la empresa</mat-label>
              <input matInput [(ngModel)]="form.companyName" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>NIT</mat-label>
              <input matInput [(ngModel)]="form.companyNit" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Dirección</mat-label>
              <input matInput [(ngModel)]="form.companyAddress" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Teléfono</mat-label>
              <input matInput [(ngModel)]="form.companyPhone" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Correo electrónico</mat-label>
              <input matInput type="email" [(ngModel)]="form.companyEmail" />
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>payments</mat-icon>
          <mat-card-title>Moneda e impuestos</mat-card-title>
          <mat-card-subtitle>Configuración regional</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="config-grid">
            <mat-form-field appearance="outline">
              <mat-label>Moneda (código)</mat-label>
              <input matInput [(ngModel)]="form.currency" placeholder="GTQ" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Símbolo de moneda</mat-label>
              <input matInput [(ngModel)]="form.currencySymbol" placeholder="Q" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Nombre del impuesto</mat-label>
              <input matInput [(ngModel)]="form.taxName" placeholder="IVA" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Tasa de impuesto (%)</mat-label>
              <input
                matInput
                type="number"
                [(ngModel)]="taxPercent"
                placeholder="12"
              />
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>palette</mat-icon>
          <mat-card-title>Apariencia</mat-card-title>
          <mat-card-subtitle>Colores del sistema</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="config-grid">
            <mat-form-field appearance="outline">
              <mat-label>Color primario</mat-label>
              <input matInput [(ngModel)]="form.primaryColor" type="color" class="color-input" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Color secundario</mat-label>
              <input matInput [(ngModel)]="form.accentColor" type="color" class="color-input" />
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <div class="actions">
        <button mat-raised-button color="primary" (click)="save()">
          <mat-icon>save</mat-icon>
          Guardar cambios
        </button>
        <button mat-stroked-button (click)="reset()">
          <mat-icon>restore</mat-icon>
          Restaurar valores
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .config-page {
        max-width: 800px;
        margin: 0 auto;
      }

      .page-title {
        font-size: 24px;
        font-weight: 500;
        margin-bottom: 24px;
        color: #333;
      }

      mat-card {
        margin-bottom: 20px;
      }

      .config-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-top: 16px;
      }

      .full-width {
        grid-column: 1 / -1;
      }

      .color-input {
        padding: 4px !important;
        height: 40px;
        cursor: pointer;
      }

      .actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }

      .actions button {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    `,
  ],
})
export default class ConfigComponent {
  private readonly config = inject(ConfigService);
  private readonly snackBar = inject(MatSnackBar);

  form: AppConfig = { ...this.config.get() };
  taxPercent = this.form.taxRate * 100;

  save(): void {
    this.form.taxRate = this.taxPercent / 100;
    this.config.update(this.form);
    this.snackBar.open('Configuración guardada correctamente', 'OK', {
      duration: 3000,
    });
  }

  reset(): void {
    this.config.reset();
    this.form = { ...this.config.get() };
    this.taxPercent = this.form.taxRate * 100;
    this.snackBar.open('Valores restaurados', 'OK', { duration: 3000 });
  }
}
