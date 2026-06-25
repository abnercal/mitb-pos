import { Component, inject } from '@angular/core';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BaseListComponent } from '../../shared/components/base-list/base-list';
import { UsuarioService } from '../../core/services/usuario.service';
import { Usuario } from '../../core/interfaces/usuario.interface';
import { UsuariosFormComponent } from '../form/usuarios-form.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>{{ title }}</h1>
      <button mat-raised-button color="primary" (click)="openCreate()">
        <mat-icon>add</mat-icon> Nuevo usuario
      </button>
    </div>
    <mat-card>
      <mat-card-content>
        <div class="table-responsive">
          <table mat-table [dataSource]="data()" class="full-table">
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let item">{{ item.nombre }} {{ item.apellido || '' }}</td>
            </ng-container>
            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef>Usuario</th>
              <td mat-cell *matCellDef="let item">{{ item.username || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let item">{{ item.email || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="sucursal">
              <th mat-header-cell *matHeaderCellDef>Sucursal</th>
              <td mat-cell *matCellDef="let item">{{ item.Sucursal?.nombre || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="roles">
              <th mat-header-cell *matHeaderCellDef>Roles</th>
              <td mat-cell *matCellDef="let item">
                @for (r of item.Roles; track r; let last = $last) {
                  <span>{{ r.nombrerol }}{{ last ? '' : ', ' }}</span>
                }
                @if (!item.Roles?.length) {
                  <span>—</span>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let item">
                <mat-chip [color]="item.estado ? 'primary' : 'warn'" highlighted>
                  {{ item.estado ? 'Activo' : 'Inactivo' }}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let item">
                <button
                  mat-icon-button
                  color="primary"
                  (click)="openEdit(item)"
                  matTooltip="Editar"
                >
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td [attr.colspan]="columns.length">
                <div class="empty-state">
                  <mat-icon>people</mat-icon>
                  <p>No hay usuarios</p>
                </div>
              </td>
            </tr>
          </table>
        </div>
        <mat-paginator
          [length]="totalItems()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[5, 10, 25, 50]"
          (page)="onPage($event)"
        >
        </mat-paginator>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .page-header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 500;
      }
      .full-table {
        width: 100%;
      }
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px;
        color: var(--mat-sys-on-surface-variant);
      }
      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
      }
    `,
  ],
})
export default class UsuariosListComponent extends BaseListComponent<Usuario> {
  override title = 'Usuarios';
  override entityName = 'usuarios';
  override formComponent = UsuariosFormComponent;
  override dialogWidth = '600px';
  override columns = ['nombre', 'username', 'email', 'sucursal', 'roles', 'estado', 'acciones'];

  private readonly usuarioService = inject(UsuarioService);

  protected override loadService(
    page: number,
    limit: number,
  ): Observable<{ data: Usuario[]; total: number }> {
    return this.usuarioService.getAll(page, limit);
  }

  protected override deleteService(id: number | string): Observable<void> {
    return this.usuarioService.delete(id as number);
  }

  protected override getId(item: Usuario): number | string {
    return item._id!;
  }
  protected override getDisplayName(item: Usuario): string {
    return item.nombre;
  }
}
