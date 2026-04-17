import { Component, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { SummaryService } from '../../services/summary';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../services/theme';
import { MatMenuModule } from '@angular/material/menu';
import { ParticleBackground } from '../../components/particle-background/particle-background';

export interface Flashcard {
  term: string;
  definition: string;
  flipped: boolean;
}

export interface QuestionItem {
  question: string;
  answer: string;
  revealed: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatTabsModule,
    MatIconModule,
    MatSnackBarModule,
    ParticleBackground,
    MatMenuModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  @ViewChild('burstCanvas') burstCanvasRef!: ElementRef<HTMLCanvasElement>;

  content = '';
  url = '';
  selectedFile: File | null = null;
  fileName = '';
  selectedImageFile: File | null = null;
  imageFileName = '';
  language = 'English';
  length = 'Short';
  format = 'Paragraph';
  summaryResult = '';
  isLoading = false;
  errorMessage = '';
  activeTab = 'text';
  isCopied = false;

  // ── NEW: structured results ──────────────────────────────
  flashcards: Flashcard[] = [];
  questions: QuestionItem[] = [];

  languages = [
    'English', 'Hindi', 'Spanish', 'French',
    'German', 'Arabic', 'Chinese', 'Japanese',
    'Korean', 'Portuguese', 'Russian', 'Italian'
  ];
  lengths = ['Short', 'Medium', 'Long'];
  formats = ['Paragraph', 'Bullets', 'Flashcards', 'Questions'];

  constructor(
    private summaryService: SummaryService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    public themeService: ThemeService
  ) {}

  // ── FLASHCARD FLIP ───────────────────────────────────────
  flipCard(card: Flashcard) {
    card.flipped = !card.flipped;
    this.cdr.detectChanges();
  }

  // ── QUESTION REVEAL ──────────────────────────────────────
  toggleAnswer(q: QuestionItem) {
    q.revealed = !q.revealed;
    this.cdr.detectChanges();
  }

  // ── PARSE FLASHCARDS FROM RESPONSE ──────────────────────
  private parseFlashcards(raw: string): Flashcard[] {
    return raw
      .split('\n')
      .filter(line => line.trim().startsWith('FLASHCARD::'))
      .map(line => {
        const parts = line.replace('FLASHCARD::', '').split('::');
        return {
          term: parts[0]?.trim() || '',
          definition: parts[1]?.trim() || '',
          flipped: false
        };
      })
      .filter(c => c.term && c.definition);
  }

  // ── PARSE QUESTIONS FROM RESPONSE ───────────────────────
  private parseQuestions(raw: string): QuestionItem[] {
    return raw
      .split('\n')
      .filter(line => line.trim().startsWith('QUESTION::'))
      .map(line => {
        const parts = line.replace('QUESTION::', '').split('::');
        return {
          question: parts[0]?.trim() || '',
          answer:   parts[1]?.trim() || '',
          revealed: false
        };
      })
      .filter(q => q.question && q.answer);
  }

  // ── FLASK SHAKE ───────────────────────────────────────────
  shakeFlask() {
    const wrap = document.querySelector('.toolbar-flask-wrap') as HTMLElement;
    if (!wrap) return;
    const svg = wrap.querySelector('.toolbar-flask-svg') as HTMLElement;
    if (!svg) return;
    svg.style.animation = 'toolbarFlaskShake 0.5s ease-in-out';
    this.spawnFlaskSpill(wrap);
    setTimeout(() => {
      svg.style.animation = 'toolbarFlaskGlow 3s ease-in-out infinite';
    }, 520);
  }

  private spawnFlaskSpill(container: HTMLElement) {
    const colors = ['#f97316', '#ec4899', '#fbbf24', '#06b6d4'];
    for (let i = 0; i < 16; i++) {
      const el    = document.createElement('div');
      const angle = Math.random() * Math.PI + Math.PI;
      const dist  = 20 + Math.random() * 40;
      const col   = colors[Math.floor(Math.random() * colors.length)];
      const sz    = 3 + Math.random() * 4;
      el.style.cssText = `
        position:absolute; width:${sz}px; height:${sz}px;
        border-radius:50%; background:${col};
        box-shadow:0 0 6px ${col};
        left:50%; top:50%;
        transform:translate(-50%,-50%);
        pointer-events:none; z-index:200;
      `;
      container.style.position = 'relative';
      container.appendChild(el);
      const dur = 300 + Math.random() * 400;
      el.animate([
        { opacity: 1, transform: `translate(-50%,-50%) scale(1)` },
        { opacity: 0, transform: `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist+10}px)) scale(0)` }
      ], { duration: dur, easing: 'cubic-bezier(0,.9,.4,1)', fill: 'forwards' });
      setTimeout(() => el.remove(), dur + 60);
    }
  }

  // ── PARTICLE BURST ────────────────────────────────────────
  onSummarizeWithBurst() {
    this.fireBurst();
    this.onSummarize();
  }

  private fireBurst() {
    const canvas = this.burstCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W  = canvas.width  = canvas.offsetWidth  || 400;
    const H  = canvas.height = canvas.offsetHeight || 120;
    const cx = W / 2, cy = H / 2;

    const style = getComputedStyle(document.body);
    const p1  = style.getPropertyValue('--neon-primary').trim()   || '#f97316';
    const p2  = style.getPropertyValue('--neon-secondary').trim() || '#ec4899';
    const p3  = style.getPropertyValue('--neon-accent').trim()    || '#fbbf24';
    const cols = [p1, p2, p3, '#ffffff'];

    interface Particle { x:number; y:number; vx:number; vy:number; r:number; col:string; alpha:number; life:number; }

    const particles: Particle[] = Array.from({ length: 60 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      return { x:cx, y:cy, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed,
               r:2+Math.random()*3, col:cols[Math.floor(Math.random()*cols.length)],
               alpha:1, life:0.018+Math.random()*0.02 };
    });

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.97; p.alpha -= p.life;
        if (p.alpha <= 0) continue;
        alive = true;
        ctx.save(); ctx.globalAlpha = p.alpha;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.col; ctx.shadowBlur = 8; ctx.shadowColor = p.col;
        ctx.fill(); ctx.restore();
      }
      if (alive) { animId = requestAnimationFrame(animate); }
      else { ctx.clearRect(0,0,W,H); cancelAnimationFrame(animId); }
    };
    animId = requestAnimationFrame(animate);
  }

  // ── AUTH ─────────────────────────────────────────────────
  isAdmin(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload.role ||
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return role === 'Admin';
  }

  // ── FILE HANDLERS ────────────────────────────────────────
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file; this.fileName = file.name;
    } else { this.errorMessage = 'Please select a valid PDF file!'; }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    const validTypes = ['image/jpeg','image/jpg','image/png','image/bmp','image/tiff','image/webp'];
    if (file && validTypes.includes(file.type)) {
      this.selectedImageFile = file; this.imageFileName = file.name;
    } else { this.errorMessage = 'Please select a valid image file!'; }
  }

  // ── SUMMARIZE ────────────────────────────────────────────
  onSummarize() {
    this.errorMessage = '';
    this.summaryResult = '';
    this.flashcards = [];
    this.questions = [];
    this.isLoading = true;
    this.cdr.detectChanges();

    const handleResponse = (response: any) => {
      const raw: string = response.summaryText ?? '';
      if (this.format === 'Flashcards') {
        this.flashcards = this.parseFlashcards(raw);
      } else if (this.format === 'Questions') {
        this.questions = this.parseQuestions(raw);
      } else {
        this.summaryResult = raw;
      }
      this.isLoading = false;
      this.cdr.detectChanges();
    };

    const handleError = (msg: string) => () => {
      this.errorMessage = msg;
      this.isLoading = false;
      this.cdr.detectChanges();
    };

    if (this.activeTab === 'text') {
      if (!this.content.trim()) { this.errorMessage = 'Please enter some text!'; this.isLoading = false; return; }
      this.summaryService.summarize('Text', this.content, this.language, this.length, this.format)
        .subscribe({ next: handleResponse, error: handleError('Failed to summarize!') });

    } else if (this.activeTab === 'url') {
      if (!this.url.trim()) { this.errorMessage = 'Please enter a URL!'; this.isLoading = false; return; }
      this.summaryService.summarizeUrl(this.url, this.language, this.length, this.format)
        .subscribe({ next: handleResponse, error: handleError('Failed to summarize URL!') });

    } else if (this.activeTab === 'pdf') {
      if (!this.selectedFile) { this.errorMessage = 'Please select a PDF file!'; this.isLoading = false; return; }
      this.summaryService.summarizePdf(this.selectedFile, this.language, this.length, this.format)
        .subscribe({ next: handleResponse, error: handleError('Failed to summarize PDF!') });

    } else if (this.activeTab === 'image') {
      if (!this.selectedImageFile) { this.errorMessage = 'Please select an image!'; this.isLoading = false; return; }
      this.summaryService.summarizeImage(this.selectedImageFile, this.language, this.length, this.format)
        .subscribe({ next: handleResponse, error: handleError('Failed to summarize image or no text found!') });
    }
  }

  // ── COPY ─────────────────────────────────────────────────
  copyToClipboard() {
    if (!this.summaryResult) return;
    navigator.clipboard.writeText(this.summaryResult).then(() => {
      this.isCopied = true; this.cdr.detectChanges();
      this.snackBar.open('✅ Summary copied to clipboard!', 'Close', {
        duration: 3000, horizontalPosition: 'end', verticalPosition: 'bottom', panelClass: ['snack-success']
      });
      setTimeout(() => { this.isCopied = false; this.cdr.detectChanges(); }, 3000);
    }).catch(() => this.snackBar.open('❌ Failed to copy!', 'Close', { duration: 3000 }));
  }

  // ── DOWNLOAD PDF ─────────────────────────────────────────
  downloadPDF() {
    if (!this.summaryResult) return;
    const payload = { summary: this.summaryResult, inputType: this.activeTab, language: this.language };
    this.summaryService.generatePdf(payload).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'summary.pdf'; a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => { this.errorMessage = 'Failed to download PDF!'; }
    });
  }

  // ── NAVIGATION ───────────────────────────────────────────
  goToHistory() { this.router.navigate(['/history']); }
  onLogout() { this.authService.logout(); this.router.navigate(['/login']); }
  goToAdmin() { this.router.navigate(['/admin']); }
}