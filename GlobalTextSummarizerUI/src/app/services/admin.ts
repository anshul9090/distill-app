import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {

private baseUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  private headers(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      })
    };
  }

  getUsers(): Observable<any>              { return this.http.get(`${this.baseUrl}/users`, this.headers()); }
  getSummaries(): Observable<any>          { return this.http.get(`${this.baseUrl}/summaries`, this.headers()); }
  deleteUser(id: number): Observable<any>  { return this.http.delete(`${this.baseUrl}/user/${id}`, this.headers()); }
  restoreUser(id: number): Observable<any> { return this.http.put(`${this.baseUrl}/restore-user/${id}`, {}, this.headers()); }
}