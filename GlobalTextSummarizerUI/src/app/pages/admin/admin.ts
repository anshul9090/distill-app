import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ParticleBackground } from '../../components/particle-background/particle-background';
import { AuthService } from '../../services/auth';
import { AdminService } from '../../services/admin';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatToolbarModule, MatCardModule, MatButtonModule,
    MatTableModule, MatIconModule, MatFormFieldModule,
    MatInputModule, ParticleBackground
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class Admin implements OnInit {

  // raw data
  users:     any[] = [];
  summaries: any[] = [];

  // filtered views
  filteredUsers:     any[] = [];
  filteredSummaries: any[] = [];

  // search
  userSearch    = '';
  summarySearch = '';

  // pagination
  summaryPage     = 1;
  summaryPageSize = 6;

  // state
  usersLoading     = true;
  summariesLoading = true;
  errorMessage     = '';

  displayedColumns = ['id', 'name', 'email', 'role', 'status', 'joined', 'actions'];

  constructor(
    private adminService: AdminService,
    private authService:  AuthService,
    private router:       Router,
    private cdr:          ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadSummaries();
  }

  // ── LOAD ──────────────────────────────────────────────
  loadUsers() {
    this.usersLoading = true;
    this.adminService.getUsers().subscribe({
      next: (res) => {
        this.users = res;
        this.applyUserSearch();
        this.usersLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load users.';
        this.usersLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadSummaries() {
    this.summariesLoading = true;
    this.adminService.getSummaries().subscribe({
      next: (res) => {
        this.summaries = res;
        this.applySummarySearch();
        this.summariesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.summariesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── SEARCH ────────────────────────────────────────────
  applyUserSearch() {
    const q = this.userSearch.toLowerCase();
    this.filteredUsers = q
      ? this.users.filter(u =>
          u.email?.toLowerCase().includes(q) ||
          u.name?.toLowerCase().includes(q))
      : [...this.users];
  }

  applySummarySearch() {
    const q = this.summarySearch.toLowerCase();
    const filtered = q
      ? this.summaries.filter(s =>
          s.userEmail?.toLowerCase().includes(q) ||
          s.inputType?.toLowerCase().includes(q) ||
          s.summaryText?.toLowerCase().includes(q))
      : [...this.summaries];
    this.filteredSummaries = filtered;
    this.summaryPage = 1;
  }

  // ── PAGINATION ────────────────────────────────────────
  get pagedSummaries() {
    const start = (this.summaryPage - 1) * this.summaryPageSize;
    return this.filteredSummaries.slice(start, start + this.summaryPageSize);
  }

  get totalSummaryPages() {
    return Math.ceil(this.filteredSummaries.length / this.summaryPageSize);
  }

  prevPage() { if (this.summaryPage > 1) this.summaryPage--; }
  nextPage() { if (this.summaryPage < this.totalSummaryPages) this.summaryPage++; }

  // ── BASIC STATS ───────────────────────────────────────
  get activeUsers()  { return this.users.filter(u => !u.isDeleted).length; }
  get deletedUsers() { return this.users.filter(u =>  u.isDeleted).length; }
  get adminUsers()   { return this.users.filter(u => u.roleId === 1).length; }

  // ── INPUT TYPE BREAKDOWN ──────────────────────────────
  get inputTypeStats(): { type: string; count: number; percent: number; icon: string }[] {
    const types = ['Text', 'PDF', 'URL', 'Image'];
    const icons = ['📝', '📄', '🔗', '🖼️'];
    const total = this.summaries.length || 1;
    return types.map((type, i) => {
      const count = this.summaries.filter(s =>
        s.inputType?.toLowerCase() === type.toLowerCase()
      ).length;
      return { type, count, percent: Math.round((count / total) * 100), icon: icons[i] };
    });
  }

  // ── TOP LANGUAGES ─────────────────────────────────────
  get languageStats(): { language: string; count: number; percent: number }[] {
    const map: Record<string, number> = {};
    this.summaries.forEach(s => {
      const lang = s.language || 'Unknown';
      map[lang] = (map[lang] || 0) + 1;
    });
    const total = this.summaries.length || 1;
    return Object.entries(map)
      .map(([language, count]) => ({
        language,
        count,
        percent: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }

  // ── LAST 7 DAYS ACTIVITY ──────────────────────────────
  get last7DaysStats(): { day: string; count: number; percent: number }[] {
    const days: { day: string; date: Date; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d,
        count: 0
      });
    }
    this.summaries.forEach(s => {
      const created = new Date(s.createdAt);
      const match = days.find(d =>
        d.date.toDateString() === created.toDateString()
      );
      if (match) match.count++;
    });
    const max = Math.max(...days.map(d => d.count), 1);
    return days.map(d => ({
      day:     d.day,
      count:   d.count,
      percent: Math.round((d.count / max) * 100)
    }));
  }

  // ── TODAY STATS ───────────────────────────────────────
  get todaySummaries(): number {
    const today = new Date().toDateString();
    return this.summaries.filter(s =>
      new Date(s.createdAt).toDateString() === today
    ).length;
  }

  get thisWeekSummaries(): number {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return this.summaries.filter(s =>
      new Date(s.createdAt) >= weekAgo
    ).length;
  }

  // ── ACTIONS ───────────────────────────────────────────
  deleteUser(id: number) {
    if (confirm('Delete this user?')) {
      this.adminService.deleteUser(id).subscribe(() => this.loadUsers());
    }
  }

  restoreUser(id: number) {
    this.adminService.restoreUser(id).subscribe(() => this.loadUsers());
  }

  goBack()   { this.router.navigate(['/dashboard']); }
  onLogout() { this.authService.logout(); this.router.navigate(['/login']); }
}