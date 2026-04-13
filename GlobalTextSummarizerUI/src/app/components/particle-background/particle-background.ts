import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-particle-background',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas #canvas style="position:fixed;inset:0;z-index:0;pointer-events:none;"></canvas>`
})
export class ParticleBackground implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private animId!: number;
  private particles: any[] = [];
  private words: any[] = [];
  private blobs: any[] = [];
  private mx = window.innerWidth / 2;
  private my = window.innerHeight / 2;
  private bt = 0;
  private W = window.innerWidth;
  private H = window.innerHeight;
  private themeColors: any = {};

  private wordList = ['Summarize','AI','Extract','Analyze','Condense',
    'Insight','Distill','Text','PDF','URL','Image','Brief','Precise','Language'];

  private onMouseMove = (e: MouseEvent) => { this.mx = e.clientX; this.my = e.clientY; };
  private onResize = () => {
    this.W = this.canvasRef.nativeElement.width = window.innerWidth;
    this.H = this.canvasRef.nativeElement.height = window.innerHeight;
  };

  constructor(private themeService: ThemeService) {}

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.W;
    canvas.height = this.H;
    this.ctx = canvas.getContext('2d')!;
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('resize', this.onResize);
    this.readThemeColors();
    this.initParticles();
    this.initWords();
    this.initBlobs();
    this.draw();
  }

  private readThemeColors() {
    const style = getComputedStyle(document.body);
    this.themeColors = {
      p1: style.getPropertyValue('--neon-primary').trim() || '#f97316',
      p2: style.getPropertyValue('--neon-secondary').trim() || '#ec4899',
      p3: style.getPropertyValue('--neon-accent').trim() || '#fbbf24',
      bg: style.getPropertyValue('--dark-bg').trim() || '#0f0a0a',
    };
  }

  private hexToRgb(hex: string): string {
    const h = hex.replace('#','');
    const r = parseInt(h.slice(0,2),16);
    const g = parseInt(h.slice(2,4),16);
    const b = parseInt(h.slice(4,6),16);
    return `${r},${g},${b}`;
  }

  private initParticles() {
    const cols = [this.themeColors.p1, this.themeColors.p2, this.themeColors.p3];
    this.particles = Array.from({length: 90}, () => ({
      x: Math.random() * this.W, y: Math.random() * this.H,
      vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5,
      r: Math.random() * 2.5 + .8,
      col: cols[Math.floor(Math.random() * cols.length)],
      alpha: Math.random() * .6 + .3,
      pulse: Math.random() * Math.PI * 2
    }));
  }

  private initWords() {
    this.words = Array.from({length: 10}, () => ({
      x: Math.random() * this.W, y: Math.random() * this.H,
      vy: -(Math.random() * .3 + .1), vx: (Math.random() - .5) * .1,
      alpha: Math.random() * .18 + .04,
      size: Math.random() * 14 + 10,
      text: this.wordList[Math.floor(Math.random() * this.wordList.length)],
      rot: (Math.random() - .5) * .3
    }));
  }

  private initBlobs() {
    this.blobs = [
      { x: this.W*.15, y: this.H*.2, r: 220, alpha: .12, speed: .002 },
      { x: this.W*.8,  y: this.H*.75, r: 280, alpha: .10, speed: .003 },
      { x: this.W*.6,  y: this.H*.1,  r: 160, alpha: .09, speed: .0015 }
    ];
  }

  private draw = () => {
    this.readThemeColors(); // picks up theme switches live
    const { p1, p2, p3, bg } = this.themeColors;
    const cols = [p1, p2, p3];
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = `rgba(${this.hexToRgb(p1)},0.04)`;
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Blobs
    this.bt += .01;
    const blobTargets = [
      [W*.1 + Math.sin(this.bt*.7)*W*.12, H*.15 + Math.cos(this.bt*.5)*H*.1],
      [W*.75 + Math.cos(this.bt*.6)*W*.1,  H*.7  + Math.sin(this.bt*.8)*H*.12],
      [W*.55 + Math.sin(this.bt*.4)*W*.15, H*.12 + Math.cos(this.bt*.9)*H*.08]
    ];
    this.blobs.forEach((b, i) => {
      b.x += (blobTargets[i][0] - b.x) * .015;
      b.y += (blobTargets[i][1] - b.y) * .015;
      const col = cols[i % 3];
      const g = ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);
      g.addColorStop(0, `rgba(${this.hexToRgb(col)},${b.alpha})`);
      g.addColorStop(1, `rgba(${this.hexToRgb(col)},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
    });

    // Floating words
    this.words.forEach(w => {
      w.y += w.vy; w.x += w.vx;
      if (w.y < -30) { w.y = H+10; w.x = Math.random()*W; w.text = this.wordList[Math.floor(Math.random()*this.wordList.length)]; }
      ctx.save();
      ctx.translate(w.x, w.y); ctx.rotate(w.rot);
      ctx.font = `${w.size}px sans-serif`;
      ctx.fillStyle = `rgba(${this.hexToRgb(p1)},${w.alpha})`;
      ctx.fillText(w.text, 0, 0);
      ctx.restore();
    });

    // Particles + connections
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.pulse += .02; p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      // Mouse repulsion
      const dx = p.x - this.mx, dy = p.y - this.my;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 120) { const f = .5*(120-dist)/120; p.vx += dx/dist*f; p.vy += dy/dist*f; }
      p.vx *= .995; p.vy *= .995;
      const spd = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
      if (spd > 1.5) { p.vx /= spd*.667; p.vy /= spd*.667; }

      // Connections
      for (let j = i+1; j < this.particles.length; j++) {
        const q = this.particles[j];
        const ex = p.x-q.x, ey = p.y-q.y, ed = Math.sqrt(ex*ex+ey*ey);
        if (ed < 130) {
          ctx.strokeStyle = `rgba(${this.hexToRgb(p.col)},${(1-ed/130)*.4})`;
          ctx.lineWidth = .6;
          ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
        }
      }

      // Glow + dot
      const pr = p.r * (1 + Math.sin(p.pulse)*.3);
      const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,pr*4);
      g.addColorStop(0, `rgba(${this.hexToRgb(p.col)},${p.alpha})`);
      g.addColorStop(1, `rgba(${this.hexToRgb(p.col)},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x,p.y,pr*4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = `rgba(${this.hexToRgb(p.col)},${p.alpha+.3})`;
      ctx.beginPath(); ctx.arc(p.x,p.y,pr,0,Math.PI*2); ctx.fill();
    }

    // Cursor glow
    const cg = ctx.createRadialGradient(this.mx,this.my,0,this.mx,this.my,80);
    cg.addColorStop(0, `rgba(${this.hexToRgb(p1)},.12)`);
    cg.addColorStop(1, `rgba(${this.hexToRgb(p1)},0)`);
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(this.mx,this.my,80,0,Math.PI*2); ctx.fill();

    this.animId = requestAnimationFrame(this.draw);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
  }
}