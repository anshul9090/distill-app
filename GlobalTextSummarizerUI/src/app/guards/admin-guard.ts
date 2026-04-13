import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const token = authService.getToken();

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  const payload = JSON.parse(atob(token.split('.')[1]));

  const role =
    payload.role ||
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

  if (role !== 'Admin') {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};