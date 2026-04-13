import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

 
private baseUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, { email, password });
  }

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, { name, email, password });
  }

  downloadPdf(summary: string) {
    return this.http.post(
      'https://localhost:7266/api/summary/generate-pdf',
      { summary },
      { responseType: 'blob' }
    );
  }

  saveToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  // Decodes JWT to read role claim
  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? null;
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    return this.getRole() === 'Admin';
  }

  // Hits server to revoke refresh token, then clears localStorage
  logout(): void {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.getToken()}`
      });
      // Fire and forget — clear localStorage regardless of response
      this.http.post(`${this.baseUrl}/logout`,
        { token: refreshToken },
        { headers }
      ).subscribe({ error: () => {} });
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}