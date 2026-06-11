import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { ModuloService } from './modulo.service';

export interface LoginResponse {
  ok: boolean;
  message: string;
  data: {
    token: string;
    usuario: {
      _id: number;
      nombre: string;
      apellido: string;
      email: string;
      username: string;
      imagen: string | null;
      imageUrl: string | null;
      idsucursal: number | null;
      Roles?: { _id: number; nombrerol: string; Permisos?: { _id: number; nombre: string }[] }[];
    };
  };
}

export interface UserSession {
  token: string;
  user: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    username: string;
    idsucursal: number | null;
    roles: string[];
    permisos: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly modulos = inject(ModuloService);
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((res) => {
          if (res.ok && res.data) {
            const permisos = [
              ...new Set(
                res.data.usuario.Roles?.flatMap((r) =>
                  r.Permisos?.map((p) => p.nombre) || []
                ) || []
              ),
            ];
            const session: UserSession = {
              token: res.data.token,
              user: {
                id: res.data.usuario._id,
                nombre: res.data.usuario.nombre,
                apellido: res.data.usuario.apellido,
                email: res.data.usuario.email,
                username: res.data.usuario.username,
                idsucursal: res.data.usuario.idsucursal,
                roles:
                  res.data.usuario.Roles?.map((r) => r.nombrerol) || [],
                permisos,
              },
            };
            this.setSession(session);
            this.modulos.load().subscribe();
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.modulos.clear();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getSession(): UserSession | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const session = this.getSession();
    return session?.user.roles.includes(role) ?? false;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((r) => this.hasRole(r));
  }

  hasPermiso(permiso: string): boolean {
    const session = this.getSession();
    return session?.user.permisos.includes(permiso) ?? false;
  }

  hasAnyPermiso(permisos: string[]): boolean {
    return permisos.some((p) => this.hasPermiso(p));
  }

  private setSession(session: UserSession): void {
    localStorage.setItem(this.TOKEN_KEY, session.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(session));
  }
}
