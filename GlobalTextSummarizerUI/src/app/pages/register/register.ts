import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../services/auth';
import { ChangeDetectorRef } from '@angular/core';
import { ParticleBackground } from '../../components/particle-background/particle-background';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    ParticleBackground,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  name = '';
  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';
    isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
          private cdr: ChangeDetectorRef,
  ) {}

  onRegister() {
    this.isLoading = true;
     this.cdr.detectChanges();  // ← add this
    this.authService.register(this.name, this.email, this.password)
      .subscribe({
        next: (response: any) => {
          localStorage.setItem('pendingEmail', this.email);
          this.isLoading = false;  // ← add this
          this.router.navigate(['/verify-otp']);
        },
        error: (err: any) => {
          this.errorMessage = 'Registration failed. Try again!';
          this.isLoading = false;  
           this.cdr.detectChanges();// ← add this
        }
      });
}
}