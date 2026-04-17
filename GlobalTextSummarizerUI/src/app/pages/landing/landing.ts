import {
  Component, OnInit, OnDestroy, ElementRef,
  ViewChild, AfterViewInit, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './landing.html',
  styleUrls: ['./landing.scss']
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('particleCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // ── Safe YouTube URL ──────────────────────────────────────
  readonly videoUrl: SafeResourceUrl;

  // ── Login form state ──────────────────────────────────────
  loginData     = { email: '', password: '' };
  loginError    = '';
  loginLoading  = false;
  showPassword  = false;

  // ── Monkey icon state ─────────────────────────────────────
  // 'idle' | 'covered' | 'peeking'
  monkeyState: 'idle' | 'covered' | 'peeking' = 'idle';
  passwordFocused = false;

  // ── Static content ────────────────────────────────────────
  readonly formats = [
    { label: 'Paragraph', icon: '📝' },
    { label: 'Bullets',   icon: '•••' },
    { label: 'Flashcards',icon: '🃏' },
    { label: 'Q & A',     icon: '❓' },
  ];

  readonly steps = [
    { num: '01', icon: '📋', title: 'Paste your content',
      desc: 'Drop in text, a URL, a PDF, or even a photo of your notes.' },
    { num: '02', icon: '⚙️', title: 'Choose your format',
      desc: 'Pick Paragraph, Bullets, Flashcards, or Q&A — in 12 languages.' },
    { num: '03', icon: '✨', title: 'Get your summary',
      desc: 'AI processes it instantly. Download as PDF or save to History.' }
  ];

  readonly features = [
    { icon: '📝', title: 'Plain Text',   desc: 'Paste articles, notes, chapters — get a clean summary.' },
    { icon: '🔗', title: 'URL Scraping', desc: 'Enter any web URL. DISTILL fetches and summarizes for you.' },
    { icon: '📄', title: 'PDF Upload',   desc: 'Upload your PDF directly. No extra tools needed.' },
    { icon: '🖼️', title: 'Image / OCR',  desc: 'Snap a photo of handwritten notes. OCR handles the rest.' }
  ];

  // ── Scroll state ──────────────────────────────────────────
  scrolled = false;

  // ── Canvas animation ──────────────────────────────────────
  private animFrameId  = 0;
  private particles: Particle[] = [];
  private scrollObserver!: IntersectionObserver;

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient,
     private authService: AuthService,
     private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.youtube.com/embed/SalpA_plUes?rel=0&modestbranding=1&autohide=1&showinfo=0'
    );
  }

  ngOnInit(): void {
    window.addEventListener('scroll', this.onScroll);
  }

  ngAfterViewInit(): void {
    this.initParticles();
    this.initScrollReveal();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    cancelAnimationFrame(this.animFrameId);
    this.scrollObserver?.disconnect();
  }

  // ── Scroll handler ────────────────────────────────────────
  private onScroll = () => { this.scrolled = window.scrollY > 40; };

  // ── Monkey password logic ─────────────────────────────────
  onPasswordFocus(): void {
    this.passwordFocused = true;
    this.updateMonkey();
  }
  onPasswordBlur(): void {
    this.passwordFocused = false;
    this.monkeyState = 'idle';
  }
  onTogglePassword(): void {
    this.showPassword = !this.showPassword;
    this.updateMonkey();
  }
  private updateMonkey(): void {
    if (!this.passwordFocused) { this.monkeyState = 'idle'; return; }
    this.monkeyState = this.showPassword ? 'peeking' : 'covered';
  }

  // ── Monkey emoji getter ───────────────────────────────────
  get monkeyEmoji(): string {
    switch (this.monkeyState) {
      case 'covered': return '🙈';
      case 'peeking': return '🐒';
      default:        return '🐵';
    }
  }

  // ── Login submission ──────────────────────────────────────
 onLogin(): void {
  if (!this.loginData.email || !this.loginData.password) {
    this.loginError = 'Please fill in all fields.';
    this.cdr.detectChanges();
    return;
  }

  this.loginLoading = true;
  this.loginError = '';
  this.cdr.detectChanges();

  this.http.post<any>(`${environment.apiUrl}/api/auth/login`, this.loginData).subscribe({
    next: (response: any) => {
      this.authService.saveToken(response.accessToken);          // ✅ matches login.ts exactly
      localStorage.setItem('refreshToken', response.refreshToken);
      this.loginLoading = false;
      this.router.navigate(['/dashboard']);
    },
    error: (err) => {
      this.loginLoading = false;
      this.loginError = err?.error?.message || 'Invalid email or password.';
      this.cdr.detectChanges();
    }
  });
}

  // ── Scroll reveal ─────────────────────────────────────────
  private initScrollReveal(): void {
    this.scrollObserver = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          this.scrollObserver.unobserve(e.target); // fire once
        }
      }),
      { threshold: 0.12 }
    );
    // observe after a tick so DOM is fully ready
    setTimeout(() => {
      document.querySelectorAll('.reveal')
        .forEach(el => this.scrollObserver.observe(el));
    }, 150);
  }

  // ── Particle canvas ───────────────────────────────────────
  private initParticles(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    this.particles = Array.from({ length: 60 }, () => new Particle(canvas));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      this.particles.forEach(p => { p.update(canvas); p.draw(ctx); });

      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx   = this.particles[i].x - this.particles[j].x;
          const dy   = this.particles[i].y - this.particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(168,85,247,${0.18 * (1 - dist / 130)})`;
            ctx.lineWidth   = 0.5;
            ctx.moveTo(this.particles[i].x, this.particles[i].y);
            ctx.lineTo(this.particles[j].x, this.particles[j].y);
            ctx.stroke();
          }
        }
      }
      this.animFrameId = requestAnimationFrame(draw);
    };
    draw();
  }
}

// ── Particle helper class ─────────────────────────────────────────────────────
class Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number; opacity: number;

  constructor(canvas: HTMLCanvasElement) {
    this.x       = Math.random() * canvas.width;
    this.y       = Math.random() * canvas.height;
    this.vx      = (Math.random() - 0.5) * 0.45;
    this.vy      = (Math.random() - 0.5) * 0.45;
    this.r       = Math.random() * 1.8 + 0.6;
    this.opacity = Math.random() * 0.5 + 0.15;
  }

  update(canvas: HTMLCanvasElement): void {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > canvas.width)  this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(168,85,247,${this.opacity})`;
    ctx.fill();
  }
}