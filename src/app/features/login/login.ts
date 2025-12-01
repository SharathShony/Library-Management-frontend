import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [RouterLink, NgIf],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  
  errorMessage = signal('');
  isLoading = signal(false);

  onSubmit(event: Event, email: string, password: string) {
    event.preventDefault();
    
    if (!email || !password) {
      this.errorMessage.set('Please enter email and password');
      return;
    }
    
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    // Call the real API
    this.auth.loginWithApi({ email, password }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Login failed. Please try again.');
      }
    });
  }
}
