import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpController: HttpTestingController;
  let authService: { getToken: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn>; parseUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = { getToken: vi.fn(), logout: vi.fn() };
    router = { navigate: vi.fn().mockResolvedValue(true), parseUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should add Authorization header when token exists', () => {
    authService.getToken.mockReturnValue('my-jwt-token');

    httpClient.get('/api/test').subscribe();

    const req = httpController.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
    req.flush({});
  });

  it('should NOT add Authorization header when no token', () => {
    authService.getToken.mockReturnValue(null);

    httpClient.get('/api/test').subscribe();

    const req = httpController.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should logout and redirect to /login on 401', () => {
    authService.getToken.mockReturnValue('some-token');

    httpClient.get('/api/test').subscribe({
      error: () => {},
    });

    const req = httpController.expectOne('/api/test');
    req.flush({ message: 'Token expirado' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should NOT logout on non-401 errors', () => {
    authService.getToken.mockReturnValue('some-token');

    httpClient.get('/api/test').subscribe({
      error: () => {},
    });

    const req = httpController.expectOne('/api/test');
    req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

    expect(authService.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should NOT logout on 500 errors', () => {
    authService.getToken.mockReturnValue('some-token');

    httpClient.get('/api/test').subscribe({
      error: () => {},
    });

    const req = httpController.expectOne('/api/test');
    req.flush({}, { status: 500, statusText: 'Server Error' });

    expect(authService.logout).not.toHaveBeenCalled();
  });
});
