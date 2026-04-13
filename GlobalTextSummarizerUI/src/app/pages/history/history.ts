import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { SummaryService } from '../../services/summary';
import { AuthService } from '../../services/auth';
import { ChangeDetectorRef } from '@angular/core';
import { ParticleBackground } from '../../components/particle-background/particle-background';
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule,
    MatChipsModule,
    ParticleBackground
  ],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class History implements OnInit {
  summaries: any[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private summaryService: SummaryService,
    private authService: AuthService,
      private cdr: ChangeDetectorRef ,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.summaryService.getHistory().subscribe({
      next: (response: any) => {
        this.summaries = response;
        this.isLoading = false;
        this.cdr.detectChanges(); 
      },
      error: (err: any) => {
        this.errorMessage = 'Failed to load history!';
        this.isLoading = false;
        this.cdr.detectChanges(); 
      }
    });
  }
deleteSummary(id: number) {
    this.summaryService.deleteSummary(id).subscribe({
        next: () => {
            this.summaries = this.summaries.filter(s => s.id !== id);
            this.cdr.detectChanges();
        },
        error: (err: any) => {
            this.errorMessage = 'Failed to delete summary!';
            this.cdr.detectChanges();
        }
    });
}

clearAll() {
    if (confirm('Are you sure you want to delete all summaries?')) {
        this.summaryService.clearAllSummaries().subscribe({
            next: () => {
                this.summaries = [];
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                this.errorMessage = 'Failed to clear summaries!';
                this.cdr.detectChanges();
            }
        });
    }
}
  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}