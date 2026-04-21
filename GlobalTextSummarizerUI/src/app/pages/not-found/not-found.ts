import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ParticleBackground } from '../../components/particle-background/particle-background';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, ParticleBackground],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss'
})
export class NotFound {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }

  goDashboard() {
    this.router.navigate(['/dashboard']);
  }
}