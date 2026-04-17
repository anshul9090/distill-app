import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/']);        // ← was '/login', now goes to landing
    return false;
  }

  // Protect admin routes — redirect regular users to dashboard
  if (state.url.startsWith('/admin') && !authService.isAdmin()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};