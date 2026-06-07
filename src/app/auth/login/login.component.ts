import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title class="login-title">
            <span class="brand-text">MITB POS</span>
          </mat-card-title>
          <mat-card-subtitle>Iniciar sesión</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form #loginForm="ngForm" (ngSubmit)="onSubmit()" class="login-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Correo electrónico</mat-label>
              <input
                matInput
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                autocomplete="email"
                placeholder="correo@ejemplo.com"
              />
              <mat-icon matPrefix>email</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input
                matInput
                [type]="hidePassword ? 'password' : 'text'"
                [(ngModel)]="password"
                name="password"
                required
                autocomplete="current-password"
              />
              <mat-icon matPrefix>lock</mat-icon>
              <button
                type="button"
                mat-icon-button
                matSuffix
                (click)="hidePassword = !hidePassword"
              >
                <mat-icon>{{
                  hidePassword ? 'visibility_off' : 'visibility'
                }}</mat-icon>
              </button>
            </mat-form-field>

            <div *ngIf="error" class="error-message">
              <mat-icon>error</mat-icon>
              <span>{{ error }}</span>
            </div>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width login-btn"
              [disabled]="loading"
            >
              <mat-spinner *ngIf="loading" diameter="20" class="btn-spinner"></mat-spinner>
              <span *ngIf="!loading">Ingresar</span>
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .login-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
        padding: 16px;
      }

      .login-card {
        width: 100%;
        max-width: 400px;
        padding: 24px;
      }

      .login-title {
        text-align: center;
        font-size: 28px;
        margin-bottom: 4px;
      }

      .brand-text {
        background: linear-gradient(135deg, #1565c0, #1976d2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 700;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-top: 16px;
      }

      .full-width {
        width: 100%;
      }

      .login-btn {
        height: 48px;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .btn-spinner {
        margin: 0 auto;
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #f44336;
        background: #ffebee;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
      }

      mat-card-subtitle {
        text-align: center;
        margin-bottom: 8px;
      }
    `,
  ],
})
export default class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  hidePassword = true;
  loading = false;
  error: string | null = null;

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.error = 'Correo y contraseña son obligatorios';
      return;
    }

    this.loading = true;
    this.error = null;

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err.error?.message || 'Error al iniciar sesión. Verificá tus credenciales.';
      },
    });
  }
}
