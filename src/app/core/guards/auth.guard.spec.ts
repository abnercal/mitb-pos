import { TestBed } from '@angular/core/testing';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard, loginGuard } from './auth.guard';

function setupTestBed(authService: { isLoggedIn: ReturnType<typeof vi.fn> }) {
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: authService },
      {
        provide: Router,
        useValue: { navigate: vi.fn().mockResolvedValue(true), parseUrl: vi.fn().mockImplementation((url: string) => url) },
      },
    ],
  });
}

function executeGuard(guardFn: CanActivateFn): ReturnType<CanActivateFn> {
  return TestBed.runInInjectionContext(() =>
    guardFn({} as any, { root: null! } as any),
  );
}

describe('authGuard', () => {
  let authService: { isLoggedIn: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = { isLoggedIn: vi.fn() };
  });

  it('should return true when user is logged in', () => {
    authService.isLoggedIn.mockReturnValue(true);
    setupTestBed(authService);
    const result = executeGuard(authGuard);
    expect(result).toBe(true);
  });

  it('should redirect to /login when user is NOT logged in', () => {
    authService.isLoggedIn.mockReturnValue(false);
    setupTestBed(authService);
    const result = executeGuard(authGuard);
    expect(result).toBe('/login');
  });
});

describe('loginGuard', () => {
  let authService: { isLoggedIn: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = { isLoggedIn: vi.fn() };
  });

  it('should return true when user is NOT logged in (allow access to login)', () => {
    authService.isLoggedIn.mockReturnValue(false);
    setupTestBed(authService);
    const result = executeGuard(loginGuard);
    expect(result).toBe(true);
  });

  it('should redirect to / when user IS logged in (prevent re-login)', () => {
    authService.isLoggedIn.mockReturnValue(true);
    setupTestBed(authService);
    const result = executeGuard(loginGuard);
    expect(result).toBe('/');
  });
});
