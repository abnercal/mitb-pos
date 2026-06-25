import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'app_theme';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly current = signal<Theme>('light');

  constructor() {
    // Recuperar preferencia guardada
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      this.apply(stored);
    } else {
      // Detectar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.apply(prefersDark ? 'dark' : 'light');
    }

    // Escuchar cambios en la preferencia del sistema si el usuario no eligió explícitamente
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        this.apply(e.matches ? 'dark' : 'light');
      }
    });
  }

  toggle(): void {
    this.apply(this.current() === 'light' ? 'dark' : 'light');
  }

  set(theme: Theme): void {
    this.apply(theme);
  }

  private apply(theme: Theme): void {
    this.current.set(theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);
  }
}
