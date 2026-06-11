import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { UsuarioService } from '../../core/services/usuario.service';
import { Usuario } from '../../core/interfaces/usuario.interface';
import { UsuariosFormComponent } from '../form/usuarios-form.component';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatChipsModule, MatDialogModule, MatSnackBarModule,
    MatFormFieldModule, MatInputModule, MatPaginatorModule,
  ],
  template: `
    <div class="page-header">
      <h1>Usuarios</h1>
      <button mat-raised-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Nuevo usuario
      </button>
    </div>
    <mat-card>
      <mat-card-header>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar usuario</mat-label>
          <input matInput [(ngModel)]="searchTerm" placeholder="Nombre, email o usuario" (input)="onSearchChange()">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </mat-card-header>
      <mat-card-content>
        <div class="table-responsive">
        <table mat-table [dataSource]="data()" class="full-table">
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let item">{{ item.nombre }} {{ item.apellido }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let item">{{ item.email }}</td>
          </ng-container>
          <ng-container matColumnDef="username">
            <th mat-header-cell *matHeaderCellDef>Username</th>
            <td mat-cell *matCellDef="let item">{{ item.username || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="roles">
            <th mat-header-cell *matHeaderCellDef>Roles</th>
            <td mat-cell *matCellDef="let item">
              <mat-chip *ngFor="let r of (item.Roles || [])" class="role-chip">{{ r.nombrerol }}</mat-chip>
              <span *ngIf="!item.Roles?.length">—</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let item">
              <mat-chip [color]="item.estado ? 'primary' : 'warn'" highlighted>{{ item.estado ? 'Activo' : 'Inactivo' }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let item">
              <button mat-icon-button (click)="openForm(item)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button (click)="delete(item)" color="warn"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td [attr.colspan]="columns.length"><div class="empty-state"><mat-icon>people</mat-icon><p>{{ searchTerm() ? 'Sin resultados' : 'No hay usuarios' }}</p></div></td>
          </tr>
        </table>
        </div>
        <mat-paginator [length]="totalItems()" [pageSize]="pageSize()"
          [pageSizeOptions]="[5, 10, 25, 50]" (page)="onPage($event)">
        </mat-paginator>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .search-field { width: 100%; max-width: 400px; margin: 16px 0 0 16px; }
    .full-table { width: 100%; }
    .role-chip { margin: 2px; font-size: 12px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
  `],
})
export default class UsuariosListComponent implements OnInit {
  private readonly service = inject(UsuarioService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = signal<Usuario[]>([]);
  readonly totalItems = signal(0);
  readonly searchTerm = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly columns = ['nombre', 'email', 'username', 'roles', 'estado', 'acciones'];

  onSearchChange(): void {
    this.pageIndex.set(0);
    this.load();
  }

  onPage(e: { pageIndex: number; pageSize: number }): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  ngOnInit(): void { this.load(); }

  private load(): void {
    const page = this.pageIndex() + 1;
    const limit = this.pageSize();
    const search = this.searchTerm();
    this.service.getAll(page, limit, search).subscribe({
      next: (r) => {
        this.data.set(r.data);
        this.totalItems.set(r.total);
      },
      error: () => this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 }),
    });
  }

  openForm(usuario?: Usuario): void {
    const ref = this.dialog.open(UsuariosFormComponent, {
      width: '600px',
      data: { usuario: usuario || null },
    });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }

  delete(u: Usuario): void {
    if (!confirm(`¿Eliminar usuario ${u.nombre}?`)) return;
    this.service.delete(u._id!).subscribe({
      next: () => { this.snackBar.open('Usuario eliminado', 'Cerrar', { duration: 2000 }); this.load(); },
      error: () => this.snackBar.open('Error al eliminar usuario', 'Cerrar', { duration: 3000 }),
    });
  }
}
