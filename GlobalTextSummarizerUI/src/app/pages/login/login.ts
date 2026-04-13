import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ChangeDetectorRef, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../services/theme';
import { ParticleBackground } from '../../components/particle-background/particle-background';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatCardModule,
    RouterLink, ParticleBackground, MatMenuModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('logoDis')    logoDis!:    ElementRef<HTMLSpanElement>;
  @ViewChild('logoStill')  logoStill!:  ElementRef<HTMLSpanElement>;
  @ViewChild('logoMerged') logoMerged!: ElementRef<HTMLSpanElement>;
  @ViewChild('logoBurst')  logoBurst!:  ElementRef<HTMLDivElement>;
  @ViewChild('flaskWrap')  flaskWrap!:  ElementRef<HTMLDivElement>;
  @ViewChild('flaskSvg')   flaskSvg!:   ElementRef<SVGElement>;

  // form
  email         = '';
  password      = '';
  errorMessage  = '';
  isLoading     = false;

  // password visibility + monkey
  showPassword    = false;
  passwordFocused = false;
  monkeyState: 'idle' | 'covering' | 'peeking' = 'idle';

  // slider
  sliderTexts = [
    'Summarize content in seconds ⚡',
    'AI-powered text insights 🤖',
    'Save time, read smarter 📚',
    'Distill the world\'s knowledge 🌍'
  ];
  currentSliderText = this.sliderTexts[0];
  private currentIndex   = 0;
  private sliderTimer:  any;
  private logoTimers:   any[] = [];
  private isMergedShown = false; // track if initial anim is done
  private isReassembling = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    public themeService: ThemeService
  ) {}

  ngOnInit() {
    this.sliderTimer = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.sliderTexts.length;
      this.currentSliderText = this.sliderTexts[this.currentIndex];
    }, 3000);
  }

  ngAfterViewInit() {
    this.runLogoAnimation();
  }

  // ── INITIAL LOGO ANIMATION ───────────────────────────────
  private runLogoAnimation() {
    const dis    = this.logoDis.nativeElement;
    const still  = this.logoStill.nativeElement;
    const merged = this.logoMerged.nativeElement;
    const burst  = this.logoBurst.nativeElement;

    this.logoTimers.push(setTimeout(() => {
      dis.style.transition   = 'all 0.52s cubic-bezier(.17,.67,.35,1.2)';
      still.style.transition = 'all 0.52s cubic-bezier(.17,.67,.35,1.2)';
      dis.style.opacity      = '1';
      still.style.opacity    = '1';
      dis.style.transform    = 'translateX(0)';
      still.style.transform  = 'translateX(0)';
    }, 400));

    this.logoTimers.push(setTimeout(() => {
      dis.style.transition   = 'all 0.18s cubic-bezier(.5,2,.5,1)';
      still.style.transition = 'all 0.18s cubic-bezier(.5,2,.5,1)';
      dis.style.transform    = 'translateX(5px)';
      still.style.transform  = 'translateX(-5px)';
    }, 980));

    this.logoTimers.push(setTimeout(() => {
      dis.style.opacity   = '0';
      still.style.opacity = '0';
      this.spawnParticles(burst);
      merged.style.transition = 'opacity 0.08s';
      merged.style.opacity    = '1';
      merged.animate([
        { transform: 'translateX(-50%) scale(1.4)', filter: 'brightness(3) blur(3px)' },
        { transform: 'translateX(-50%) scale(1.0)', filter: 'brightness(1) blur(0)'   }
      ], { duration: 520, easing: 'cubic-bezier(.17,.67,.35,1)', fill: 'forwards' });
      this.isMergedShown = true;
    }, 1200));
  }

  // ── ON CLICK DISTILL TEXT — EXPLODE + REASSEMBLE ─────────
  onLogoClick() {
    if (!this.isMergedShown || this.isReassembling) return;
    this.isReassembling = true;

    const merged = this.logoMerged.nativeElement;
    const burst  = this.logoBurst.nativeElement;
    const dis    = this.logoDis.nativeElement;
    const still  = this.logoStill.nativeElement;

    // Step 1 — explode outward
    merged.animate([
      { transform: 'translateX(-50%) scale(1)',   filter: 'brightness(1) blur(0)',    opacity: '1' },
      { transform: 'translateX(-50%) scale(2.2)', filter: 'brightness(4) blur(6px)',  opacity: '0' }
    ], { duration: 300, easing: 'cubic-bezier(.5,0,1,.5)', fill: 'forwards' });

    this.spawnParticles(burst);

    // Step 2 — fly parts back in from sides
    setTimeout(() => {
      merged.style.opacity = '0';
      dis.style.opacity    = '1';
      still.style.opacity  = '1';
      dis.style.transition   = 'none';
      still.style.transition = 'none';
      dis.style.transform    = 'translateX(-120px)';
      still.style.transform  = 'translateX(120px)';

      requestAnimationFrame(() => {
        dis.style.transition   = 'all 0.45s cubic-bezier(.17,.67,.35,1.2)';
        still.style.transition = 'all 0.45s cubic-bezier(.17,.67,.35,1.2)';
        dis.style.transform    = 'translateX(0)';
        still.style.transform  = 'translateX(0)';
      });
    }, 280);

    // Step 3 — overshoot + merge again
    setTimeout(() => {
      dis.style.transition   = 'all 0.18s cubic-bezier(.5,2,.5,1)';
      still.style.transition = 'all 0.18s cubic-bezier(.5,2,.5,1)';
      dis.style.transform    = 'translateX(5px)';
      still.style.transform  = 'translateX(-5px)';
    }, 760);

    setTimeout(() => {
      dis.style.opacity   = '0';
      still.style.opacity = '0';
      this.spawnParticles(burst);
      merged.style.transition = 'opacity 0.08s';
      merged.style.opacity    = '1';
      merged.animate([
        { transform: 'translateX(-50%) scale(1.4)', filter: 'brightness(3) blur(3px)' },
        { transform: 'translateX(-50%) scale(1.0)', filter: 'brightness(1) blur(0)'   }
      ], { duration: 520, easing: 'cubic-bezier(.17,.67,.35,1)', fill: 'forwards' });
      this.isReassembling = false;
    }, 980);
  }

  // ── FLASK SPILL ON HOVER/TOUCH ────────────────────────────
  onFlaskHover() {
   const svg = this.flaskSvg?.nativeElement as unknown as HTMLElement;
    if (!svg) return;
    svg.style.animation = 'flaskShake 0.45s ease-in-out';
    this.spawnFlaskSpill();
    setTimeout(() => {
      svg.style.animation = 'flaskGlow 2.8s ease-in-out infinite';
    }, 460);
  }

  private spawnFlaskSpill() {
    const container = this.flaskWrap?.nativeElement;
    if (!container) return;
    const colors = ['#f97316', '#ec4899', '#fbbf24', '#06b6d4', '#ffffff'];
    for (let i = 0; i < 22; i++) {
      const el  = document.createElement('div');
      const ang = Math.PI * 0.3 + Math.random() * Math.PI * 1.4; // wide downward arc
      const d   = 25 + Math.random() * 55;
      const col = colors[Math.floor(Math.random() * colors.length)];
      const sz  = 3 + Math.random() * 5;
      el.style.cssText = `
        position:absolute;
        width:${sz}px; height:${sz}px;
        border-radius:50%;
        background:${col};
        box-shadow:0 0 8px ${col};
        left:50%; top:40%;
        transform:translate(-50%,-50%);
        pointer-events:none;
        z-index:50;
      `;
      container.appendChild(el);
      const dur = 350 + Math.random() * 450;
      el.animate([
        { opacity: 1, transform: `translate(-50%,-50%) scale(1)` },
        { opacity: 0, transform: `translate(calc(-50% + ${Math.cos(ang)*d}px), calc(-50% + ${Math.sin(ang)*d + 15}px)) scale(0)` }
      ], { duration: dur, easing: 'cubic-bezier(0,.8,.3,1)', fill: 'forwards' });
      setTimeout(() => el.remove(), dur + 80);
    }
  }

  // ── SHARED PARTICLE SPAWNER ───────────────────────────────
  private spawnParticles(container: HTMLElement) {
    const colors = ['#f97316','#ec4899','#fbbf24','#ffffff','#ff9f43'];
    for (let i = 0; i < 32; i++) {
      const el  = document.createElement('div');
      const ang = Math.random() * Math.PI * 2;
      const d   = 30 + Math.random() * 70;
      const col = colors[Math.floor(Math.random() * colors.length)];
      const sz  = 3 + Math.random() * 4;
      el.style.cssText = `
        position:absolute; width:${sz}px; height:${sz}px;
        border-radius:50%; background:${col};
        box-shadow:0 0 6px ${col};
        left:50%; top:50%;
        transform:translate(-50%,-50%);
        pointer-events:none; z-index:20;
      `;
      container.appendChild(el);
      const dur = 280 + Math.random() * 420;
      el.animate([
        { opacity: 1, transform: `translate(-50%,-50%) scale(1)` },
        { opacity: 0, transform: `translate(calc(-50% + ${Math.cos(ang)*d}px), calc(-50% + ${Math.sin(ang)*d}px)) scale(0)` }
      ], { duration: dur, easing: 'cubic-bezier(0,0,.2,1)', fill: 'forwards' });
      setTimeout(() => el.remove(), dur + 60);
    }
  }

  // ── MONKEY LOGIC ─────────────────────────────────────────
  onPasswordFocus() {
    this.passwordFocused = true;
    this.monkeyState = this.showPassword ? 'peeking' : 'covering';
    this.cdr.detectChanges();
  }

  onPasswordBlur() {
    this.passwordFocused = false;
    this.monkeyState = 'idle';
    this.cdr.detectChanges();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    if (this.passwordFocused) {
      this.monkeyState = this.showPassword ? 'peeking' : 'covering';
    }
    this.cdr.detectChanges();
  }

  // ── AUTH ─────────────────────────────────────────────────
  onLogin() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        this.authService.saveToken(response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.errorMessage = 'Invalid email or password!';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    clearInterval(this.sliderTimer);
    this.logoTimers.forEach(t => clearTimeout(t));
  }
}