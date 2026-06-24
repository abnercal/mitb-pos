import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      this.handleHttpError(error);
      return;
    }

    if (error instanceof Error) {
      console.error('[App Error]', error.message, error.stack);
      return;
    }

    console.error('[Unknown Error]', error);
  }

  private handleHttpError(error: HttpErrorResponse): void {
    const message = error.error?.message || error.message || 'Error de conexión';
    console.error(`[HTTP ${error.status}]`, message);
  }
}
