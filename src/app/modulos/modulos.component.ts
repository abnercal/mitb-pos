import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ModuloService } from '../core/services/modulo.service';
import { PermisoService } from '../core/services/permiso.service';
import { Modulo } from '../core/interfaces/modulo.interface';
import { Permiso } from '../core/interfaces/permiso.interface';

@Component({
  selector: 'app-modulos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatCardModule, MatSnackBarModule,
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>settings</mat-icon> Asignación de permisos a módulos
          </mat-card-title>
          <mat-card-subtitle>
            Solo superadmin — cada módulo del sistema puede protegerse con un permiso específico.
            Si se deja vacío, el módulo es público (sin restricción).
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <table mat-table [dataSource]="modulos()" class="full-width">
            <ng-container matColumnDef="feature_key">
              <th mat-header-cell *matHeaderCellDef>Feature</th>
              <td mat-cell *matCellDef="let m"><code>{{ m.feature_key }}</code></td>
            </ng-container>

            <ng-container matColumnDef="feature_label">
              <th mat-header-cell *matHeaderCellDef>Módulo</th>
              <td mat-cell *matCellDef="let m">{{ m.feature_label }}</td>
            </ng-container>

            <ng-container matColumnDef="permiso_nombre">
              <th mat-header-cell *matHeaderCellDef>Permiso asignado</th>
              <td mat-cell *matCellDef="let m">
                <mat-form-field appearance="outline" class="permiso-select">
                  <mat-select
                    [value]="m.permiso_nombre ?? ''"
                    (valueChange)="onChange(m, $event)"
                  >
                    <mat-option value="">— Sin permiso —</mat-option>
                    <mat-option *ngFor="let p of permisos()" [value]="p.nombre">
                      {{ p.nombre }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </td>
            </ng-container>

            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let m">
                <mat-icon *ngIf="savedIds().has(m._id)" class="saved-icon">check_circle</mat-icon>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="columns.length">
                <div class="empty-state">
                  <mat-icon>info</mat-icon>
                  <p>Cargando módulos...</p>
                </div>
              </td>
            </tr>
          </table>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-raised-button color="primary" (click)="load()">
            <mat-icon>refresh</mat-icon> Recargar
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { padding: 24px; max-width: 900px; margin: 0 auto; }
    .full-width { width: 100%; }
    .permiso-select { width: 280px; }
    .saved-icon { color: #4caf50; }
    .empty-state { text-align: center; padding: 24px; color: #999; }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; }
    mat-card-header { margin-bottom: 16px; }
    mat-card-title mat-icon { vertical-align: middle; margin-right: 8px; }
  `],
})
export default class ModulosComponent implements OnInit {
  private readonly moduloService = inject(ModuloService);
  private readonly permisoService = inject(PermisoService);
  private readonly snackBar = inject(MatSnackBar);

  readonly modulos = signal<Modulo[]>([]);
  readonly permisos = signal<Permiso[]>([]);
  readonly savedIds = signal<Set<number>>(new Set());
  readonly columns = ['feature_key', 'feature_label', 'permiso_nombre', 'estado'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.savedIds.set(new Set());

    this.moduloService.loadAll().subscribe({
      next: (modulos) => this.modulos.set(modulos),
      error: () => this.snackBar.open('Error al cargar módulos', 'Cerrar', { duration: 3000 }),
    });

    this.permisoService.getAllList().subscribe({
      next: (permisos) => this.permisos.set(permisos),
      error: () => this.snackBar.open('Error al cargar permisos', 'Cerrar', { duration: 3000 }),
    });
  }

  onChange(modulo: Modulo, value: string): void {
    const permiso_nombre = value || null;
    this.moduloService.update(modulo._id, { permiso_nombre }).subscribe({
      next: () => {
        const updated = this.modulos().map((m) =>
          m._id === modulo._id ? { ...m, permiso_nombre } : m
        );
        this.modulos.set(updated);
        this.savedIds.set(new Set([...this.savedIds(), modulo._id]));
        setTimeout(() => {
          const s = this.savedIds();
          s.delete(modulo._id);
          this.savedIds.set(new Set(s));
        }, 2000);
      },
      error: () => this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 }),
    });
  }
}
