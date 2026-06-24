import { Component, OnInit, OnDestroy, inject, NgZone, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface ScannerDialogData {
  onDetect: (code: string) => Promise<boolean>;
}

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Escanear código</h2>
    <mat-dialog-content>
      <div #scannerContainer class="scanner-box">
        <div *ngIf="loading" class="scanner-loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>{{ loadingText }}</p>
        </div>
      </div>
      <p *ngIf="error" class="scanner-error">{{ error }}</p>
      <p *ngIf="checking" class="scanner-checking">
        <mat-spinner diameter="16"></mat-spinner>
        Buscando producto…
      </p>
      <p *ngIf="!loading && !error && hintText" class="scanner-hint">{{ hintText }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .scanner-box {
      width: 100%; min-height: 300px; position: relative;
      overflow: hidden; border-radius: 8px; background: #000;
    }
    .scanner-box video {
      width: 100%; height: 100%; object-fit: cover;
      display: block;
    }
    .scanner-loading {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      height: 300px; color: #fff; gap: 16px;
    }
    .scanner-error { color: #e53935; text-align: center; margin-top: 12px; }
    .scanner-hint { color: #888; text-align: center; margin-top: 8px; font-size: 12px; }
    .scanner-checking {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; color: #1565c0; margin-top: 12px; font-weight: 500;
    }
  `],
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {
  @ViewChild('scannerContainer', { static: true }) container!: ElementRef;

  private readonly dialogRef = inject(MatDialogRef<BarcodeScannerComponent>);
  private readonly data = inject<ScannerDialogData>(MAT_DIALOG_DATA, { optional: true });
  private readonly ngZone = inject(NgZone);

  loading = true;
  loadingText = 'Iniciando cámara…';
  checking = false;
  error = '';
  hintText = '';

  private codeReader: import('@zxing/library').BrowserMultiFormatReader | null = null;
  private destroyed = false;

  // ── Inicialización ─────────────────────────────────────────────

  async ngOnInit(): Promise<void> {
    if (!this.isSecureContext()) {
      this.showHttpsError();
      return;
    }

    await this.startScanning();
  }

  private async startScanning(): Promise<void> {
    try {
      const { BrowserMultiFormatReader, DecodeHintType } = await import('@zxing/library');

      // TRY_HARDER mejora detección de códigos 1D (barras) y en condiciones
      // de iluminación/bajo contraste. Es más lento but más preciso.
      const hints = new Map<any, any>();
      hints.set(DecodeHintType.TRY_HARDER, true);

      this.codeReader = new BrowserMultiFormatReader(hints, 200);

      const video = this.createVideoElement();
      this.container.nativeElement.appendChild(video);

      // Usamos decodeFromConstraints para pasar resolución mínima explícita,
      // lo que mejora la detección de códigos de barras 1D (necesitan más pixeles)
      await this.codeReader.decodeFromConstraints(
        {
          video: {
            facingMode: 'environment',
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 },
          },
        },
        video,
        (result) => {
          if (this.destroyed) return;
          const code = result?.getText();
          if (code) {
            this.stopScanning();
            this.verifyCode(code);
          }
        },
      );

      this.ngZone.run(() => {
        this.loading = false;
        this.hintText = 'Enfocá un código de barras o QR';
      });
    } catch (err: any) {
      this.handleError(err);
    }
  }

  private createVideoElement(): HTMLVideoElement {
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    return video;
  }

  // ── Verificación ───────────────────────────────────────────────

  private async verifyCode(code: string): Promise<void> {
    this.ngZone.run(() => {
      this.checking = true;
      this.error = '';
    });

    try {
      const found = await this.data?.onDetect(code) ?? true;
      if (found) {
        this.cleanup();
        this.ngZone.run(() => this.dialogRef.close(code));
      } else {
        this.ngZone.run(() => {
          this.error = `Código "${code}" no encontrado en sistema`;
          this.checking = false;
        });
        await this.startScanning();
      }
    } catch {
      this.ngZone.run(() => {
        this.error = 'Error al verificar código';
        this.checking = false;
      });
      await this.startScanning();
    }
  }

  // ── Control de scanner ─────────────────────────────────────────

  private stopScanning(): void {
    this.codeReader?.stopContinuousDecode();
    this.codeReader?.stopAsyncDecode();
  }

  // ── Limpieza ───────────────────────────────────────────────────

  private cleanup(): void {
    if (this.codeReader) {
      try { this.codeReader.reset(); } catch { /* ignore */ }
      this.codeReader = null;
    }
    const video = this.container?.nativeElement?.querySelector('video');
    if (video?.parentNode) {
      video.parentNode.removeChild(video);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.cleanup();
  }

  cancel(): void {
    this.destroyed = true;
    this.cleanup();
    this.dialogRef.close(null);
  }

  // ── Helpers ────────────────────────────────────────────────────

  private isSecureContext(): boolean {
    // navigator.mediaDevices solo existe en contextos seguros (HTTPS o localhost)
    return !!(navigator.mediaDevices?.getUserMedia);
  }

  private showHttpsError(): void {
    this.ngZone.run(() => {
      this.error = [
        'La cámara requiere HTTPS para funcionar en mobile.',
        '',
        'Ejecutá en tu PC:',
        '  npm run dev-ssl',
        '',
        'Y accedé desde el celular con:',
        '  https://192.168.x.x:4200',
        '',
        '(El browser va a mostrar advertencia de certificado,',
        ' hace click en "Advanced → Proceed anyway")',
      ].join('\n');
      this.loading = false;
    });
  }

  private handleError(err: any): void {
    this.ngZone.run(() => {
      this.loading = false;
      const msg = err?.message || err?.toString() || '';

      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        this.error = 'Permiso de cámara denegado. Permití el acceso en la configuración del navegador.';
      } else if (msg.includes('NotFoundError')) {
        this.error = 'No se detectó una cámara en este dispositivo.';
      } else {
        this.error = `Error al iniciar cámara: ${msg}`;
      }
    });
  }
}
