import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SummaryService {

private baseUrl = `${environment.apiUrl}/api/summary`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

 summarize(inputType: string, content: string, 
          language: string, length: string, 
          format: string): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.baseUrl}/summarize`, {
        inputType,
        content,
        language,
        length,
        format
    }, { headers });
}
  getHistory(): Observable<any> {
  const token = this.authService.getToken();
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  return this.http.get(`${this.baseUrl}/history`, { headers });
}
deleteSummary(id: number): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
    });
    return this.http.delete(`${this.baseUrl}/${id}`, { headers });
}
clearAllSummaries(): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
    });
    return this.http.delete(`${this.baseUrl}/clear-all`, { headers });
}
summarizeUrl(url: string, language: string, 
             length: string, format: string): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
    });
    return this.http.post(`${this.baseUrl}/summarize-url`, {
        inputType: 'URL',
        content: url,
        language,
        length,
        format
    }, { headers });
}

summarizePdf(file: File, language: string, 
             length: string, format: string): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
    });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    formData.append('length', length);
    formData.append('format', format);
    return this.http.post(`${this.baseUrl}/summarize-pdf`, 
        formData, { headers });
}

summarizeImage(file: File, language: string, 
               length: string, format: string): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
    });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    formData.append('length', length);
    formData.append('format', format);
    return this.http.post(`${this.baseUrl}/summarize-image`, 
        formData, { headers });
}
generatePdf(data: any) {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

  return this.http.post(
    'https://localhost:7266/api/summary/generate-pdf',
    data,
    {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

}
}
