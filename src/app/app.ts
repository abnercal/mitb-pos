import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ModuloService } from './core/services/modulo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly modulos = inject(ModuloService);

  ngOnInit(): void {
    // Precargar mapa feature→permiso si hay sesión activa
    if (this.auth.isLoggedIn()) {
      this.modulos.load().subscribe();
    }
  }
}
