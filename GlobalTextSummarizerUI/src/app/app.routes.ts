import { Routes } from '@angular/router';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { History } from './pages/history/history';
import { authGuard } from './guards/auth-guard';
import { VerifyOtp } from './pages/verify-otp/verify-otp';
import { adminGuard } from './guards/admin-guard';
import { LandingComponent } from './pages/landing/landing';
import { NotFound } from './pages/not-found/not-found';

export const routes: Routes = [
  { path: '',           component: LandingComponent },          // Landing IS the login now
  { path: 'login',      redirectTo: '', pathMatch: 'full' },    // /login → landing
  { path: 'register',   component: Register },
  { path: 'verify-otp', component: VerifyOtp },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
  },
  {
    path: 'history',
    component: History,
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin').then(m => m.Admin),
    canActivate: [authGuard, adminGuard]
  },
  { path: '**', component: NotFound }   
];