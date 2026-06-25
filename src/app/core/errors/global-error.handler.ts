import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  private snackBar?: MatSnackBar;
  private zone?: NgZone;

  handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      this.handleHttpError(error);
      return;
    }

    if (error instanceof Error) {
      console.error('[App Error]', error.message, error.stack);
      this.showUserMessage('Ocurrió un error inesperado. Revisá la consola para más detalles.');
      return;
    }

    console.error('[Unknown Error]', error);
    this.showUserMessage('Error desconocido');
  }

  private handleHttpError(error: HttpErrorResponse): void {
    const message = error.error?.message || error.message || 'Error de conexión con el servidor';
    console.error(`[HTTP ${error.status}]`, message);

    // Errores específicos que merecen mensaje al usuario
    if (error.status === 0) {
      this.showUserMessage('No se puede conectar con el servidor. Verificá tu conexión.');
    } else if (error.status === 401) {
      this.showUserMessage('Sesión expirada. Iniciá sesión de nuevo.');
      // Podríamos redirigir al login, pero eso lo maneja el interceptor HTTP
    } else if (error.status >= 500) {
      this.showUserMessage('Error en el servidor. Intentalo de nuevo más tarde.');
    }
    // 4xx no se muestran como snackbar global porque cada componente ya maneja sus errores
  }

  private showUserMessage(message: string): void {
    try {
      if (!this.snackBar) {
        this.snackBar = inject(MatSnackBar);
      }
      if (!this.zone) {
        this.zone = inject(NgZone);
      }
      // Angular Material snackbar necesita run fuera de la zona async
      this.zone.run(() => {
        this.snackBar!.open(message, 'Cerrar', { duration: 5000 });
      });
    } catch {
      // Si el inject falla (por ejemplo en server-side rendering), no romper
      console.warn('[GlobalErrorHandler] SnackBar no disponible');
    }
  }
}
