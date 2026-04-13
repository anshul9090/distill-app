import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { History } from './pages/history/history';
import { authGuard } from './guards/auth-guard';
import { VerifyOtp } from './pages/verify-otp/verify-otp';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'verify-otp', component: VerifyOtp },
    { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [authGuard]  // ← protected!
  },
  {     path: 'history', 
    component: History,
    canActivate: [authGuard]  // ← protected!
  },
 {
  path: 'admin',
  loadComponent: () =>
    import('./pages/admin/admin').then(m => m.Admin),
  canActivate: [authGuard, adminGuard]   // 🔥 ADD THIS
},
  { path: '**', redirectTo: 'login' }
];
