import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { ParticleBackground } from '../../components/particle-background/particle-background';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    ParticleBackground
  ],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.scss'
})
export class VerifyOtp implements OnInit {
  otpCode = '';
  email = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.email = localStorage.getItem('pendingEmail') || '';
    if (!this.email) {
      this.router.navigate(['/register']);
    }
  }

  onVerify() {
    if (!this.otpCode.trim()) {
      this.errorMessage = 'Please enter OTP!';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.http.post('https://localhost:7266/api/otp/verify', {
      email: this.email,
      otpCode: this.otpCode
    }).subscribe({
      next: (response: any) => {
        this.successMessage = 'Email verified! Redirecting to login...';
        this.isLoading = false;
        localStorage.removeItem('pendingEmail');
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err: any) => {
        this.errorMessage = 'Invalid or expired OTP. Try again!';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onResendOtp() {
    this.http.post('https://localhost:7266/api/otp/send', 
      JSON.stringify(this.email), 
      { headers: { 'Content-Type': 'application/json' }}
    ).subscribe({
      next: () => {
        this.successMessage = 'OTP resent! Check your email.';
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to resend OTP!';
        this.cdr.detectChanges();
      }
    });
  }
}