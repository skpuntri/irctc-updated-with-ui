import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Protects routes that require any authenticated user */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/auth/login']);
  return false;
};

/** Protects routes that require ROLE_ADMIN */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdmin()) return true;
  if (!auth.isLoggedIn()) router.navigate(['/auth/login']);
  else router.navigate(['/unauthorized']);
  return false;
};

/** Protects routes that require ROLE_NORMAL or ROLE_ADMIN */
export const userGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isNormalUser() || auth.isAdmin()) return true;
  if (!auth.isLoggedIn()) router.navigate(['/auth/login']);
  else router.navigate(['/unauthorized']);
  return false;
};

/** Redirects already-logged-in users away from login/register pages */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  if (auth.isAdmin()) router.navigate(['/admin/dashboard']);
  else router.navigate(['/user/bookings']);
  return false;
};
