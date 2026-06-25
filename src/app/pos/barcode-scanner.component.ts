import { Component, OnInit, OnDestroy, inject, NgZone, ViewChild, ElementRef } from '@angular/core';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Escanear código</h2>
    <mat-dialog-content>
      <div #scannerContainer class="scanner-box"></div>
      @if (loading) {
        <p class="scanner-loading">{{ loadingText }}</p>
      }
      @if (error) {
        <p class="scanner-error">{{ error }}</p>
      }
      @if (!loading && !error && hintText) {
        <p class="scanner-hint">{{ hintText }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .scanner-box {
        width: 100%;
        min-height: 300px;
        position: relative;
        overflow: hidden;
        border-radius: 8px;
        background: #000;
      }
      .scanner-box video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .scanner-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        margin-top: 12px;
      }
      .scanner-error {
        color: var(--mat-sys-error);
        text-align: center;
        margin-top: 12px;
      }
      .scanner-hint {
        color: #888;
        text-align: center;
        margin-top: 8px;
        font-size: 12px;
      }
    `,
  ],
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {
  @ViewChild('scannerContainer', { static: true }) container!: ElementRef;

  private readonly dialogRef = inject(MatDialogRef<BarcodeScannerComponent>);
  private readonly ngZone = inject(NgZone);

  loading = true;
  loadingText = 'Iniciando cámara…';
  error = '';
  hintText = '';

  private destroyed = false;
  private ready = false;

  // ── Init ────────────────────────────────────────────────────────

  async ngOnInit(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.showHttpsError();
      return;
    }
    await this.startScanning();
  }

  // ── Quagga ──────────────────────────────────────────────────────

  private async startScanning(): Promise<void> {
    const { default: Quagga } = await import('@ericblade/quagga2');
    if (this.destroyed) return;

    this.ngZone.run(() => {
      this.loading = true;
      this.loadingText = 'Iniciando cámara…';
      this.error = '';
    });

    try {
      await Quagga.init({
        inputStream: {
          type: 'LiveStream',
          constraints: {
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 },
            facingMode: 'environment',
          },
          target: this.container.nativeElement,
          willReadFrequently: true,
        },
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'code_128_reader',
            'code_39_reader',
            'codabar_reader',
            'upc_reader',
            'upc_e_reader',
            'i2of5_reader',
            'code_93_reader',
          ],
        },
        locate: true,
        canvas: { createOverlay: false },
      });
      if (this.destroyed) return;

      // Ignorar detecciones por 1.5s para dar tiempo a enfocar
      this.ngZone.run(() => {
        this.hintText = 'Enfocando…';
      });

      Quagga.onDetected((result) => {
        if (this.destroyed || !this.ready) return;
        const code = result?.codeResult?.code;
        if (code) {
          this.destroyed = true;
          this.ngZone.run(() => this.dialogRef.close(code));
        }
      });

      Quagga.start();

      this.ngZone.run(() => {
        this.loading = false;
        this.loadingText = '';
      });

      setTimeout(() => {
        if (!this.destroyed) {
          this.ready = true;
          this.ngZone.run(() => {
            this.hintText = 'Enfocá un código de barras o QR';
          });
        }
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.ngZone.run(() => {
        this.loading = false;
        if (msg.includes('NotAllowedError')) {
          this.error = 'Permiso de cámara denegado. Permití acceso en configuración del navegador.';
        } else if (msg.includes('NotFoundError')) {
          this.error = 'No se detectó una cámara en este dispositivo.';
        } else {
          this.error = `Error al iniciar cámara: ${msg}`;
        }
      });
    }
  }

  // ── Cleanup ─────────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.destroyed = true;
    // Si Quagga no llegó a estar listo, no intentamos detenerlo
    import('@ericblade/quagga2')
      .then((m) => {
        try {
          m.default.offDetected();
          m.default.offProcessed();
          m.default.stop();
        } catch {
          /* ya fue liberado */
        }
      })
      .catch(() => {
        /* promesa iniciada por onDetect, error ignorado */
      });
  }

  cancel(): void {
    this.ngOnDestroy();
    this.ngZone.run(() => this.dialogRef.close(null));
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
}
