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
    <p *ngIf="!loading && !error && decoderLabel" class="scanner-decoder-label">{{ decoderLabel }}</p>
      <p *ngIf="checking" class="scanner-checking">
        <mat-spinner diameter="16"></mat-spinner>
        Buscando producto…
      </p>
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
    .scanner-decoder-label { color: #888; text-align: center; margin-top: 8px; font-size: 12px; }
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
  decoderLabel = '';

  private async ensureVideoDimensions(): Promise<void> {
    while (this.videoEl && (this.videoEl.videoWidth === 0 || this.videoEl.videoHeight === 0)) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private detectTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;
  private decoderFn: ((video: HTMLVideoElement) => Promise<string | null>) | null = null;

  // ── Inicialización ─────────────────────────────────────────────

  async ngOnInit(): Promise<void> {
    try {
      // Pedir cámara
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { min: 640 }, height: { min: 480 } },
      });

      // Crear video y mostrarlo
      this.videoEl = document.createElement('video');
      this.videoEl.srcObject = this.stream;
      this.videoEl.setAttribute('playsinline', '');
      this.videoEl.muted = true;
      this.videoEl.style.width = '100%';
      this.videoEl.style.height = '100%';
      this.videoEl.style.objectFit = 'cover';
      this.container.nativeElement.appendChild(this.videoEl);
      await this.videoEl.play();

      // Esperar a que el video tenga frames reales
      if (this.videoEl.readyState < 2) {
        await new Promise<void>((resolve) => {
          this.videoEl!.onloadeddata = () => resolve();
        });
      }
      // Forzar que las dimensiones estén disponibles
      await this.ensureVideoDimensions();

      // Elegir el mejor decoder disponible
      this.decoderFn = await this.selectDecoder();
      if (!this.decoderFn) {
        this.error = 'No hay decoder disponible en este navegador.';
        this.loading = false;
        return;
      }

      this.ngZone.run(() => { this.loading = false; });
      this.startDetection();
    } catch (err: any) {
      this.handleError(err);
    }
  }

  // ── Selección de decoder ───────────────────────────────────────

  private async selectDecoder(): Promise<((video: HTMLVideoElement) => Promise<string | null>) | null> {
    // 1. ZXing (JS puro, funciona siempre, no depende del navegador)
    const zxing = await this.tryZxingDecoder();
    if (zxing) return zxing;

    // 2. Fallback: BarcodeDetector nativo
    return this.tryNativeDecoder();
  }

  // ── Decoder nativo (BarcodeDetector) ───────────────────────────

  private async tryNativeDecoder(): Promise<((video: HTMLVideoElement) => Promise<string | null>) | null> {
    const BD = (window as any).BarcodeDetector;
    if (!BD) return null;

    let supported: string[];
    try {
      supported = await BD.getSupportedFormats();
    } catch {
      return null;
    }

    // Solo usamos nativo si tiene al menos un formato 1D que nos sirva
    const has1D = supported.some((f: string) => FORMATS_1D.has(f));
    if (!has1D) return null;

    const formats = supported.filter((f: string) => f === 'qr_code' || FORMATS_1D.has(f));

    let detector: any;
    try {
      detector = new BD({ formats });
    } catch {
      return null;
    }

    this.ngZone.run(() => {
      this.loadingText = 'Usando decoder nativo…';
      this.decoderLabel = `Nativo (${formats.join(', ')})`;
    });

    return async (video: HTMLVideoElement) => {
      try {
        const barcodes = await detector.detect(video);
        return barcodes.length > 0 ? (barcodes[0].rawValue as string) : null;
      } catch {
        return null;
      }
    };
  }

  // ── Decoder JS (@zxing/library) ────────────────────────────────

  private zxingReader: any = null;
  private zxingCanvas: HTMLCanvasElement | null = null;
  private zxingCtx: CanvasRenderingContext2D | null = null;

  private async tryZxingDecoder(): Promise<((video: HTMLVideoElement) => Promise<string | null>) | null> {
    try {
      const { MultiFormatReader, BinaryBitmap, HybridBinarizer, RGBLuminanceSource } =
        await import('@zxing/library');

      this.zxingReader = new MultiFormatReader();
      this.zxingCanvas = document.createElement('canvas');
      this.zxingCtx = this.zxingCanvas.getContext('2d', { willReadFrequently: true })!;

      this.ngZone.run(() => {
        this.loadingText = 'Usando decoder JS…';
        this.decoderLabel = 'ZXing (JS)';
      });

      return async (video: HTMLVideoElement) => {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) return null;

        this.zxingCanvas!.width = w;
        this.zxingCanvas!.height = h;
        this.zxingCtx!.drawImage(video, 0, 0);

        const imageData = this.zxingCtx!.getImageData(0, 0, w, h);
        const source = new RGBLuminanceSource(imageData.data, w, h);
        const bitmap = new BinaryBitmap(new HybridBinarizer(source));

        try {
          const result = this.zxingReader.decode(bitmap);
          return result.getText();
        } catch {
          return null; // no se detectó nada en este frame
        }
      };
    } catch {
      return null;
    }
  }

  // ── Verificación ───────────────────────────────────────────────

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
        // Reanudar detección
        this.restartDetection();
      }
    } catch {
      this.ngZone.run(() => {
        this.error = 'Error al verificar código';
        this.checking = false;
      });
      this.restartDetection();
    }
  }

  private restartDetection(): void {
    if (this.destroyed) return;
    this.startDetection();
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
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.videoEl?.parentNode) {
      this.videoEl.parentNode.removeChild(this.videoEl);
      this.videoEl = null;
    }
    this.zxingCanvas = null;
    this.zxingCtx = null;
  }

  ngOnDestroy(): void {
    this.stopAll();
  }

  cancel(): void {
    this.stopAll();
    this.dialogRef.close(null);
  }

  private handleError(err: any): void {
    this.ngZone.run(() => {
      this.loading = false;
      if (err?.toString()?.includes('NotAllowedError') || err?.toString()?.includes('Permission')) {
        this.error = 'Permiso de cámara denegado. Permití el acceso en la configuración del navegador.';
      } else if (err?.toString()?.includes('NotFoundError')) {
        this.error = 'No se detectó una cámara en este dispositivo.';
      } else {
        this.error = `Error al iniciar cámara: ${err?.message || err}`;
      }
    });
  }
}
