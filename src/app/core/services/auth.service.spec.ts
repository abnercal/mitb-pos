import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { ModuloService } from './modulo.service';

const mockLoginResponse = {
  ok: true,
  message: 'Login exitoso',
  data: {
    token: 'test-token-abc',
    usuario: {
      _id: 1,
      nombre: 'Admin',
      apellido: 'Test',
      email: 'admin@test.com',
      username: 'admin',
      imagen: null,
      imageUrl: null,
      idsucursal: 1,
      Roles: [
        {
          _id: 1,
          nombrerol: 'ADMIN',
          Permisos: [
            { _id: 1, nombre: 'ver_productos' },
            { _id: 2, nombre: 'ver_ventas' },
          ],
        },
        {
          _id: 2,
          nombrerol: 'CAJERO',
          Permisos: [{ _id: 3, nombre: 'ver_pos' }],
        },
      ],
    },
  },
};

const mockLoginResponseNoRoles = {
  ok: true,
  message: 'Login exitoso',
  data: {
    token: 'no-roles-token',
    usuario: {
      _id: 2,
      nombre: 'User',
      apellido: 'Simple',
      email: 'user@test.com',
      username: 'user',
      imagen: null,
      imageUrl: null,
      idsucursal: null,
      Roles: undefined,
    },
  },
};

describe('AuthService', () => {
  let service: AuthService;
  let httpController: HttpTestingController;
  let moduloService: { load: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn>; parseUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    moduloService = { load: vi.fn().mockReturnValue(of({})), clear: vi.fn() };
    router = { navigate: vi.fn().mockResolvedValue(true), parseUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: router },
        { provide: ModuloService, useValue: moduloService },
      ],
    });

    service = TestBed.inject(AuthService);
    httpController = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpController.verify();
    localStorage.clear();
  });

  // ── Creación ──────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── Login ─────────────────────────────────────────────

  describe('login()', () => {
    it('should POST to /auth/login with credentials', () => {
      service.login('admin@test.com', '123456').subscribe();
      const req = httpController.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'admin@test.com', password: '123456' });
      req.flush(mockLoginResponse);
    });

    it('should store token in localStorage on success', () => {
      service.login('admin@test.com', 'x').subscribe();
      httpController.expectOne('/api/auth/login').flush(mockLoginResponse);
      expect(localStorage.getItem('auth_token')).toBe('test-token-abc');
    });

    it('should store session in localStorage on success', () => {
      service.login('admin@test.com', 'x').subscribe();
      httpController.expectOne('/api/auth/login').flush(mockLoginResponse);
      const session = JSON.parse(localStorage.getItem('auth_user')!);
      expect(session.user.id).toBe(1);
      expect(session.user.nombre).toBe('Admin');
      expect(session.user.apellido).toBe('Test');
      expect(session.user.email).toBe('admin@test.com');
    });

    it('should extract roles from response', () => {
      service.login('admin@test.com', 'x').subscribe();
      httpController.expectOne('/api/auth/login').flush(mockLoginResponse);
      const session = JSON.parse(localStorage.getItem('auth_user')!);
      expect(session.user.roles).toEqual(['ADMIN', 'CAJERO']);
    });

    it('should extract unique permissions from all roles', () => {
      service.login('admin@test.com', 'x').subscribe();
      httpController.expectOne('/api/auth/login').flush(mockLoginResponse);
      const session = JSON.parse(localStorage.getItem('auth_user')!);
      expect(session.user.permisos).toContain('ver_productos');
      expect(session.user.permisos).toContain('ver_ventas');
      expect(session.user.permisos).toContain('ver_pos');
    });

    it('should handle user with no roles', () => {
      service.login('user@test.com', 'x').subscribe();
      httpController.expectOne('/api/auth/login').flush(mockLoginResponseNoRoles);
      const session = JSON.parse(localStorage.getItem('auth_user')!);
      expect(session.user.roles).toEqual([]);
      expect(session.user.permisos).toEqual([]);
    });

    it('should call moduloService.load() on success', () => {
      service.login('admin@test.com', 'x').subscribe();
      httpController.expectOne('/api/auth/login').flush(mockLoginResponse);
      expect(moduloService.load).toHaveBeenCalledTimes(1);
    });
  });

  // ── Logout ────────────────────────────────────────────

  describe('logout()', () => {
    it('should remove token from localStorage', () => {
      localStorage.setItem('auth_token', 'some-token');
      localStorage.setItem('auth_user', '{"user":{}}');
      service.logout();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('auth_user')).toBeNull();
    });

    it('should call moduloService.clear()', () => {
      service.logout();
      expect(moduloService.clear).toHaveBeenCalledTimes(1);
    });

    it('should navigate to /login', () => {
      service.logout();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // ── Sesión ────────────────────────────────────────────

  describe('getToken()', () => {
    it('should return null when no token', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return stored token', () => {
      localStorage.setItem('auth_token', 'my-token');
      expect(service.getToken()).toBe('my-token');
    });
  });

  describe('getSession()', () => {
    it('should return null when no session stored', () => {
      expect(service.getSession()).toBeNull();
    });

    it('should return parsed session', () => {
      const session = { token: 'x', user: { id: 1, nombre: 'Admin' } };
      localStorage.setItem('auth_user', JSON.stringify(session));
      expect(service.getSession()).toEqual(session);
    });
  });

  describe('isLoggedIn()', () => {
    it('should return false when no token', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should return true when token exists', () => {
      localStorage.setItem('auth_token', 'some-token');
      expect(service.isLoggedIn()).toBe(true);
    });
  });

  // ── Roles ─────────────────────────────────────────────

  describe('hasRole()', () => {
    it('should return false when no session', () => {
      expect(service.hasRole('ADMIN')).toBe(false);
    });

    it('should return true when user has role', () => {
      localStorage.setItem(
        'auth_user',
        JSON.stringify({ token: 'x', user: { roles: ['ADMIN', 'CAJERO'] } }),
      );
      expect(service.hasRole('ADMIN')).toBe(true);
      expect(service.hasRole('CAJERO')).toBe(true);
    });

    it('should return false when user does not have role', () => {
      localStorage.setItem(
        'auth_user',
        JSON.stringify({ token: 'x', user: { roles: ['CAJERO'] } }),
      );
      expect(service.hasRole('ADMIN')).toBe(false);
    });
  });

  describe('hasAnyRole()', () => {
    it('should return true when user has any matching role', () => {
      localStorage.setItem(
        'auth_user',
        JSON.stringify({ token: 'x', user: { roles: ['CAJERO'] } }),
      );
      expect(service.hasAnyRole(['ADMIN', 'CAJERO'])).toBe(true);
    });

    it('should return false when user has none of the roles', () => {
      localStorage.setItem(
        'auth_user',
        JSON.stringify({ token: 'x', user: { roles: ['USER'] } }),
      );
      expect(service.hasAnyRole(['ADMIN', 'CAJERO'])).toBe(false);
    });
  });

  // ── Permisos ──────────────────────────────────────────

  describe('hasPermiso()', () => {
    it('should return false when no session', () => {
      expect(service.hasPermiso('ver_ventas')).toBe(false);
    });

    it('should return true when user has permiso', () => {
      localStorage.setItem(
        'auth_user',
        JSON.stringify({ token: 'x', user: { permisos: ['ver_ventas', 'ver_productos'] } }),
      );
      expect(service.hasPermiso('ver_ventas')).toBe(true);
      expect(service.hasPermiso('ver_productos')).toBe(true);
    });

    it('should return false when user does not have permiso', () => {
      localStorage.setItem(
        'auth_user',
        JSON.stringify({ token: 'x', user: { permisos: ['ver_ventas'] } }),
      );
      expect(service.hasPermiso('ver_productos')).toBe(false);
    });
  });

  describe('hasAnyPermiso()', () => {
    it('should return true when user has any matching permiso', () => {
      localStorage.setItem(
        'auth_user',
        JSON.stringify({ token: 'x', user: { permisos: ['ver_pos'] } }),
      );
      expect(service.hasAnyPermiso(['ver_ventas', 'ver_pos'])).toBe(true);
    });

    it('should return false when user has none of the permisos', () => {
      localStorage.setItem(
        'auth_user',
        JSON.stringify({ token: 'x', user: { permisos: ['ver_pos'] } }),
      );
      expect(service.hasAnyPermiso(['ver_ventas', 'ver_productos'])).toBe(false);
    });
  });
});
