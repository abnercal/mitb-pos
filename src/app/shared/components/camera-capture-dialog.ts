import {
  Component,
  ElementRef,
  inject,
  viewChild,
  AfterViewInit,
  OnDestroy,
  signal,
} from '@angular/core';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-camera-capture',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Tomar foto</h2>
    <mat-dialog-content>
      <div class="camera-wrapper">
        <video #video autoplay playsinline></video>
        <canvas #canvas hidden></canvas>
        @if (error()) {
          <div class="camera-error">{{ error() }}</div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="center">
      <button mat-raised-button color="primary" (click)="capture()" [disabled]="!!error()">
        <mat-icon>camera</mat-icon>
        Capturar
      </button>
      <button mat-button mat-dialog-close>Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .camera-wrapper {
        position: relative;
        width: 320px;
        max-width: 80vw;
        aspect-ratio: 4 / 3;
        background: #000;
        border-radius: 12px;
        overflow: hidden;
      }
      video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .camera-error {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        background: rgba(0, 0, 0, 0.7);
        padding: 16px;
        text-align: center;
      }
      mat-dialog-actions {
        padding: 16px 0;
      }
    `,
  ],
})
export class CameraCaptureDialog implements AfterViewInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<CameraCaptureDialog>);
  private stream: MediaStream | null = null;

  readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  readonly error = signal<string | null>(null);

  async ngAfterViewInit(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      this.video().nativeElement.srcObject = this.stream;
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string } | null;
      if (e?.name === 'NotAllowedError') {
        this.error.set(
          'Permiso de cámara denegado. Permití el acceso en la configuración del navegador.',
        );
      } else if (e?.name === 'NotFoundError') {
        this.error.set('No se encontró ninguna cámara en este dispositivo.');
      } else {
        this.error.set('Error al acceder a la cámara.');
      }
    }
  }

  capture(): void {
    const videoEl = this.video().nativeElement;
    const canvasEl = this.canvas().nativeElement;
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    const ctx = canvasEl.getContext('2d')!;
    ctx.drawImage(videoEl, 0, 0);
    canvasEl.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
        this.stopStream();
        this.dialogRef.close(file);
      },
      'image/jpeg',
      0.9,
    );
  }

  private stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }

  ngOnDestroy(): void {
    this.stopStream();
  }
}
