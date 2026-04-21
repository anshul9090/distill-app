import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SummaryService {

  private baseUrl = `${environment.apiUrl}/api/summary`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private authHeaders(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getToken()}`
      })
    };
  }

  summarize(inputType: string, content: string,
            language: string, length: string,
            format: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/summarize`,
      { inputType, content, language, length, format },
      this.authHeaders()
    );
  }

  summarizeUrl(url: string, language: string,
               length: string, format: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/summarize-url`,
      { inputType: 'URL', content: url, language, length, format },
      this.authHeaders()
    );
  }

  summarizePdf(file: File, language: string,
               length: string, format: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    formData.append('length', length);
    formData.append('format', format);
    return this.http.post(`${this.baseUrl}/summarize-pdf`,
      formData, this.authHeaders()
    );
  }

  summarizeImage(file: File, language: string,
                 length: string, format: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    formData.append('length', length);
    formData.append('format', format);
    return this.http.post(`${this.baseUrl}/summarize-image`,
      formData, this.authHeaders()
    );
  }

  getHistory(): Observable<any> {
    return this.http.get(`${this.baseUrl}/history`, this.authHeaders());
  }

  deleteSummary(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, this.authHeaders());
  }

  clearAllSummaries(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/clear-all`, this.authHeaders());
  }

  // ← FIXED: was hardcoded to localhost:7266
  generatePdf(data: any): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/generate-pdf`, data, {
      responseType: 'blob',
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      })
    });
  }
}