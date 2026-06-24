import { Component, OnInit, OnDestroy, inject, NgZone, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface ScannerDialogData {
  onDetect: (code: string) => Promise<boolean>;
}

/** Formatos 1D que necesitamos para POS */
const FORMATS_1D = new Set([
  'ean_13', 'ean_8', 'upc_a', 'upc_e',
  'code_128', 'code_39', 'codabar', 'itf',
]);

type DecoderFn = (video: HTMLVideoElement) => Promise<string | null>;

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

  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private detectTimer: ReturnType<typeof setInterval> | null = null;
  private decoderFn: DecoderFn | null = null;
  private decoderLabel = '';
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
      // 1. Pedir cámara con resolución decente
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { min: 640, ideal: 1280 },
          height: { min: 480, ideal: 720 },
        },
      });

      // 2. Crear video y mostrarlo
      this.videoEl = document.createElement('video');
      this.videoEl.srcObject = this.stream;
      this.videoEl.setAttribute('playsinline', '');
      this.videoEl.muted = true;
      this.videoEl.style.width = '100%';
      this.videoEl.style.height = '100%';
      this.videoEl.style.objectFit = 'cover';
      this.container.nativeElement.appendChild(this.videoEl);
      await this.videoEl.play();

      // 3. Esperar que el video tenga frames
      if (this.videoEl.readyState < 2) {
        await new Promise<void>((resolve) => {
          this.videoEl!.onloadeddata = () => resolve();
        });
      }
      await this.ensureVideoDimensions();

      // 4. Elegir el mejor decoder
      this.decoderFn = await this.selectDecoder();
      if (!this.decoderFn) {
        this.error = 'No hay decoder disponible en este navegador.';
        this.loading = false;
        return;
      }

      this.ngZone.run(() => {
        this.loading = false;
        this.hintText = this.decoderLabel
          ? `Usando ${this.decoderLabel} — enfocá un código de barras o QR`
          : 'Enfocá un código de barras o QR';
      });

      this.startDetection();
    } catch (err: any) {
      this.handleError(err);
    }
  }

  private async ensureVideoDimensions(): Promise<void> {
    while (this.videoEl && (this.videoEl.videoWidth === 0 || this.videoEl.videoHeight === 0)) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // ── Selección de decoder (NATIVO primero, ZXing fallback) ─────

  private async selectDecoder(): Promise<DecoderFn | null> {
    // 1. Nativo: BarcodeDetector — soporta 1D + QR en mobile Firefox/Chrome
    const native = await this.tryNativeDecoder();
    if (native) return native;

    // 2. Fallback: ZXing vía BrowserMultiFormatReader
    return this.tryZxingDecoder();
  }

  // ── Decoder nativo (BarcodeDetector) ───────────────────────────

  private async tryNativeDecoder(): Promise<DecoderFn | null> {
    const BD = (window as any).BarcodeDetector;
    if (!BD) return null;

    let supported: string[];
    try {
      supported = await BD.getSupportedFormats();
    } catch {
      return null;
    }

    // Necesitamos al menos QR o un formato 1D
    const hasUseful = supported.some((f: string) => f === 'qr_code' || FORMATS_1D.has(f));
    if (!hasUseful) return null;

    const formats = supported.filter((f: string) => f === 'qr_code' || FORMATS_1D.has(f));

    let detector: any;
    try {
      detector = new BD({ formats });
    } catch {
      return null;
    }

    this.decoderLabel = `Nativo (${formats.join(', ')})`;

    return async (video: HTMLVideoElement) => {
      try {
        const barcodes = await detector.detect(video);
        return barcodes.length > 0 ? (barcodes[0].rawValue as string) : null;
      } catch {
        return null;
      }
    };
  }

  // ── Decoder ZXing (fallback para desktop Chrome) ──────────────

  private zxingReader: import('@zxing/library').BrowserMultiFormatReader | null = null;

  private async tryZxingDecoder(): Promise<DecoderFn | null> {
    try {
      const { BrowserMultiFormatReader, DecodeHintType } = await import('@zxing/library');
      const hints = new Map<any, any>();
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints, 200);
      this.zxingReader = reader;
      this.decoderLabel = 'ZXing (JS)';

      return async (video: HTMLVideoElement) => {
        try {
          const bitmap = reader.createBinaryBitmap(video);
          const result = reader.decodeBitmap(bitmap);
          return result.getText();
        } catch {
          return null;
        }
      };
    } catch {
      return null;
    }
  }

  // ── Loop de detección ─────────────────────────────────────────

  private startDetection(): void {
    if (this.destroyed || !this.decoderFn) return;
    this.detectTimer = setInterval(async () => {
      if (this.destroyed || !this.videoEl || !this.decoderFn) return;
      const code = await this.decoderFn(this.videoEl);
      if (!code) return;
      this.stopDetection();
      await this.verifyCode(code);
    }, 300);
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
        this.stopAll();
        this.ngZone.run(() => this.dialogRef.close(code));
      } else {
        this.ngZone.run(() => {
          this.error = `Código "${code}" no encontrado en sistema`;
          this.checking = false;
        });
        this.startDetection();
      }
    } catch {
      this.ngZone.run(() => {
        this.error = 'Error al verificar código';
        this.checking = false;
      });
      this.startDetection();
    }
  }

  // ── Limpieza ───────────────────────────────────────────────────

  private stopDetection(): void {
    if (this.detectTimer) {
      clearInterval(this.detectTimer);
      this.detectTimer = null;
    }
  }

  private stopAll(): void {
    this.destroyed = true;
    this.stopDetection();

    if (this.zxingReader) {
      try { this.zxingReader.reset(); } catch { /* ignore */ }
      this.zxingReader = null;
    }
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    if (this.videoEl?.parentNode) {
      this.videoEl.parentNode.removeChild(this.videoEl);
      this.videoEl = null;
    }
  }

  ngOnDestroy(): void {
    this.stopAll();
  }

  cancel(): void {
    this.stopAll();
    this.dialogRef.close(null);
  }

  // ── Helpers ────────────────────────────────────────────────────

  private isSecureContext(): boolean {
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
        '(Si ves advertencia de certificado, usa Firefox en el celular)',
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
