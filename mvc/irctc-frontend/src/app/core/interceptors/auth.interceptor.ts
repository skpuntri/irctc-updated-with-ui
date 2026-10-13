import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getAccessToken();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Don't intercept refresh-token or login calls to avoid infinite loops
      if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh-token')) {
        return throwError(() => err);
      }

      if (err.status === 401 && authService.getRefreshToken()) {
        // Try to refresh
        return authService.refreshToken().pipe(
          switchMap(res => {
            const newToken = res.token || res.accessToken || '';
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` }
            });
            return next(retryReq);
          }),
          catchError(() => {
            authService.logout();
            router.navigate(['/auth/login']);
            return throwError(() => err);
          })
        );
      }
      if (err.status === 403) {
        router.navigate(['/unauthorized']);
      }
      return throwError(() => err);
    })
  );
};
