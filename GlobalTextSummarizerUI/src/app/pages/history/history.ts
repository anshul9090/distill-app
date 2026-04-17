import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { SummaryService } from '../../services/summary';
import { AuthService } from '../../services/auth';
import { ParticleBackground } from '../../components/particle-background/particle-background';

const TAGS_STORAGE_KEY = 'distill_summary_tags';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    ParticleBackground
  ],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class History implements OnInit {
  summaries: any[] = [];
  isLoading = true;
  errorMessage = '';

  // ── SEARCH + FILTER ──────────────────────────────────────
  searchQuery = '';
  filterType = 'All';   // All | Text | PDF | URL | Image
  filterTag  = 'All';   // All | any tag name

  inputTypes = ['All', 'Text', 'PDF', 'URL', 'Image'];

  // ── TAGGING ───────────────────────────────────────────────
  // { summaryId: ['Physics', 'Chapter 3'] }
  tagsMap: Record<number, string[]> = {};

  // inline tag editing state
  editingTagId: number | null = null;
  newTagInput = '';

  // preset suggestions shown in dropdown
  tagSuggestions = [
    'Physics', 'Chemistry', 'Biology', 'Maths',
    'History', 'Economics', 'English', 'Computer Science',
    'Research', 'Assignment', 'Exam Prep', 'Notes'
  ];

  constructor(
    private summaryService: SummaryService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadTagsFromStorage();
    this.loadHistory();
  }

  // ── STORAGE ───────────────────────────────────────────────
  private loadTagsFromStorage() {
    try {
      const raw = localStorage.getItem(TAGS_STORAGE_KEY);
      this.tagsMap = raw ? JSON.parse(raw) : {};
    } catch { this.tagsMap = {}; }
  }

  private saveTagsToStorage() {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(this.tagsMap));
  }

  // ── HISTORY LOAD ──────────────────────────────────────────
  loadHistory() {
    this.summaryService.getHistory().subscribe({
      next: (response: any) => {
        this.summaries = response;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load history!';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── COMPUTED: all unique tags for filter dropdown ─────────
  get allUsedTags(): string[] {
    const set = new Set<string>();
    Object.values(this.tagsMap).forEach(tags => tags.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }

  // ── COMPUTED: filtered summaries ─────────────────────────
  get filteredSummaries(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.summaries.filter(s => {
      // type filter
      if (this.filterType !== 'All' && s.inputType !== this.filterType) return false;

      // tag filter
      if (this.filterTag !== 'All') {
        const tags = this.tagsMap[s.id] ?? [];
        if (!tags.includes(this.filterTag)) return false;
      }

      // search filter — matches summary text or tags
      if (q) {
        const inText = s.summaryText?.toLowerCase().includes(q);
        const inTags = (this.tagsMap[s.id] ?? []).some(t => t.toLowerCase().includes(q));
        if (!inText && !inTags) return false;
      }

      return true;
    });
  }

  // ── TAG ACTIONS ───────────────────────────────────────────
  getTagsFor(id: number): string[] {
    return this.tagsMap[id] ?? [];
  }

  startTagEdit(id: number) {
    this.editingTagId = id;
    this.newTagInput = '';
    this.cdr.detectChanges();
  }

  cancelTagEdit() {
    this.editingTagId = null;
    this.newTagInput = '';
    this.cdr.detectChanges();
  }

  addTag(id: number, tag: string) {
    const clean = tag.trim();
    if (!clean) return;
    if (!this.tagsMap[id]) this.tagsMap[id] = [];
    if (!this.tagsMap[id].includes(clean)) {
      this.tagsMap[id] = [...this.tagsMap[id], clean];
      this.saveTagsToStorage();
    }
    this.newTagInput = '';
    this.cdr.detectChanges();
  }

  addTagFromInput(id: number) {
    this.addTag(id, this.newTagInput);
  }

  removeTag(id: number, tag: string) {
    if (!this.tagsMap[id]) return;
    this.tagsMap[id] = this.tagsMap[id].filter(t => t !== tag);
    this.saveTagsToStorage();
    this.cdr.detectChanges();
  }

  // ── DELETE / CLEAR ────────────────────────────────────────
  deleteSummary(id: number) {
    this.summaryService.deleteSummary(id).subscribe({
      next: () => {
        this.summaries = this.summaries.filter(s => s.id !== id);
        delete this.tagsMap[id];
        this.saveTagsToStorage();
        this.cdr.detectChanges();
      },
      error: () => {
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
          this.tagsMap = {};
          this.saveTagsToStorage();
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorMessage = 'Failed to clear summaries!';
          this.cdr.detectChanges();
        }
      });
    }
  }

  // ── RESET FILTERS ─────────────────────────────────────────
  resetFilters() {
    this.searchQuery = '';
    this.filterType  = 'All';
    this.filterTag   = 'All';
    this.cdr.detectChanges();
  }

  get isFiltering(): boolean {
    return this.searchQuery !== '' || this.filterType !== 'All' || this.filterTag !== 'All';
  }

  // ── NAV ───────────────────────────────────────────────────
  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}