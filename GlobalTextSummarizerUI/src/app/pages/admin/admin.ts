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

  // pagination for summaries
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

  // ── COMPUTED STATS ────────────────────────────────────
  get activeUsers()   { return this.users.filter(u => !u.isDeleted).length; }
  get deletedUsers()  { return this.users.filter(u =>  u.isDeleted).length; }
  get adminUsers()    { return this.users.filter(u => u.roleId === 1).length; }

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