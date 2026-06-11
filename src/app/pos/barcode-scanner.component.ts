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
    <h2 mat-dialog-title>Escanear código de barras</h2>
    <mat-dialog-content>
      <div #scannerContainer id="scanner-container" class="scanner-box">
        <div *ngIf="loading" class="scanner-loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Iniciando cámara…</p>
        </div>
      </div>
      <p *ngIf="error" class="scanner-error">{{ error }}</p>
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
    .scanner-box { width: 100%; min-height: 300px; position: relative; overflow: hidden; border-radius: 8px; background: #000; }
    .scanner-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: #fff; gap: 16px; }
    .scanner-error { color: #e53935; text-align: center; margin-top: 12px; }
    .scanner-checking { display: flex; align-items: center; justify-content: center; gap: 8px; color: #1565c0; margin-top: 12px; font-weight: 500; }
    #scanner-container video { width: 100% !important; }
  `],
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {
  @ViewChild('scannerContainer', { static: true }) container!: ElementRef;

  private readonly dialogRef = inject(MatDialogRef<BarcodeScannerComponent>);
  private readonly data = inject<ScannerDialogData>(MAT_DIALOG_DATA, { optional: true });
  private readonly ngZone = inject(NgZone);

  loading = true;
  checking = false;
  error = '';

  private html5Qrcode: any = null;

  async ngOnInit(): Promise<void> {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      this.html5Qrcode = new Html5Qrcode('scanner-container');

      await this.html5Qrcode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText: string) => {
          // Detected a code — verify with parent before closing
          this.ngZone.run(async () => {
            // Pausar escaneo momentáneamente
            this.html5Qrcode.pause();
            this.checking = true;
            this.error = '';

            try {
              const found = await this.data?.onDetect(decodedText) ?? true;
              if (found) {
                this.stop();
                this.dialogRef.close(decodedText);
              } else {
                this.error = `Código "${decodedText}" no encontrado en sistema`;
                this.checking = false;
                this.html5Qrcode.resume();
              }
            } catch {
              this.error = 'Error al verificar código';
              this.checking = false;
              this.html5Qrcode.resume();
            }
          });
        },
        () => {
          // Ignore individual frame errors
        },
      );

      this.ngZone.run(() => {
        this.loading = false;
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        this.loading = false;
        if (
          err?.toString()?.includes('NotAllowedError') ||
          err?.toString()?.includes('Permission')
        ) {
          this.error =
            'Permiso de cámara denegado. Permití el acceso en la configuración del navegador.';
        } else if (err?.toString()?.includes('NotFoundError')) {
          this.error = 'No se detectó una cámara en este dispositivo.';
        } else {
          this.error = `Error al iniciar cámara: ${err?.message || err}`;
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private stop(): void {
    if (this.html5Qrcode) {
      try {
        this.html5Qrcode.stop();
      } catch {
        // ignore
      }
    }
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
