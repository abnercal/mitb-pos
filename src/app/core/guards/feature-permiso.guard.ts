import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ModuloService } from '../services/modulo.service';

/**
 * Guard dinámico que consulta la tabla `modulos` para saber qué permiso
 * protege un feature, y verifica que el usuario lo tenga.
 *
 * Uso: canActivate: [featurePermisoGuard('inventario')]
 */
export const featurePermisoGuard = (featureKey: string): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const modulos = inject(ModuloService);
    const router = inject(Router);

    return modulos.load().pipe(
      map(() => {
        const permiso = modulos.getPermiso(featureKey);

        // Si el feature no exige permiso, pasa
        if (!permiso) return true;

        if (auth.hasPermiso(permiso)) return true;

        return router.parseUrl('/');
      })
    );
  };
};
