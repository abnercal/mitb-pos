import { Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BaseListComponent } from '../../shared/components/base-list/base-list';
import { ClienteService } from '../../core/services/cliente.service';
import { Cliente } from '../../core/interfaces/cliente.interface';
import { ClienteFormComponent } from '../form/cliente-form.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatPaginatorModule,
  ],
  template: `
    <div class="page-header">
      <h1>{{ title }}</h1>
      <button mat-raised-button color="primary" (click)="openCreate()">
        <mat-icon>add</mat-icon> Nuevo cliente
      </button>
    </div>

    <mat-card>
      <mat-card-header>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar cliente</mat-label>
          <input
            matInput
            [(ngModel)]="searchTerm"
            placeholder="Nombre, teléfono o NIT"
            (input)="onSearchChange()"
          />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </mat-card-header>
      <mat-card-content>
        <div class="table-responsive">
          <table mat-table [dataSource]="data()" class="full-table">
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let item">
                <strong>{{ item.nombres }} {{ item.apellidos }}</strong>
              </td>
            </ng-container>
            <ng-container matColumnDef="nit">
              <th mat-header-cell *matHeaderCellDef>NIT</th>
              <td mat-cell *matCellDef="let item">{{ item.nit || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="telefono">
              <th mat-header-cell *matHeaderCellDef>Teléfono</th>
              <td mat-cell *matCellDef="let item">{{ item.telefono || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="tipo">
              <th mat-header-cell *matHeaderCellDef>Tipo</th>
              <td mat-cell *matCellDef="let item">
                <mat-chip highlighted>{{ item.tipoClie?.nombre || '—' }}</mat-chip>
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
                <button mat-icon-button color="warn" (click)="delete(item)" matTooltip="Eliminar">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="columns.length">
                <div class="empty-state">
                  <mat-icon>people_outline</mat-icon>
                  <p>{{ searchTerm() ? 'Sin resultados' : 'No hay clientes registrados' }}</p>
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
      .search-field {
        width: 100%;
        max-width: 400px;
        margin: 16px 0 0 16px;
      }
      .full-table {
        width: 100%;
      }
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px;
        color: #999;
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
export default class ClientesListComponent extends BaseListComponent<Cliente> {
  override title = 'Clientes';
  override entityName = 'clientes';
  override formComponent = ClienteFormComponent;
  override dialogWidth = '600px';
  override columns = ['nombre', 'nit', 'telefono', 'tipo', 'estado', 'acciones'];

  readonly searchTerm = signal('');

  private readonly clienteService = inject(ClienteService);

  protected override buildParams(): { page: number; limit: number; search: string } {
    return { page: this.pageIndex() + 1, limit: this.pageSize(), search: this.searchTerm() };
  }

  protected override loadService(
    page: number,
    limit: number,
    search?: string,
  ): Observable<{ data: Cliente[]; total: number }> {
    return this.clienteService.getAll(page, limit, search);
  }

  protected override deleteService(id: number | string): Observable<void> {
    return this.clienteService.delete(id as number);
  }

  protected override getId(item: Cliente): number | string {
    return item._id!;
  }
  protected override getDisplayName(item: Cliente): string {
    return `${item.nombres} ${item.apellidos || ''}`;
  }
}
