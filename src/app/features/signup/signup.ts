import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  imports: [RouterLink, NgIf],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  private auth = inject(AuthService);
  private router = inject(Router);
  
  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);

  isPasswordValid(password: string): boolean {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  onSubmit(event: Event, username: string, email: string, password: string, confirmPassword: string) {
    event.preventDefault();
    
    // Reset messages
    this.errorMessage.set('');
    this.successMessage.set('');
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return;
    }
    
    if (!this.isPasswordValid(password)) {
      this.errorMessage.set('Password does not meet all requirements');
      return;
    }
    
    this.isLoading.set(true);
    
    // Call the signup API
    this.auth.signupWithApi({ username, email, password }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set('Account created successfully! Redirecting to login...');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        
        let errorMsg = 'Signup failed. Please try again.';
        
        // Handle validation errors (400) from ASP.NET Core model validation
        if (error.status === 400 && error.error?.errors) {
          const validationErrors = error.error.errors;
          const errorMessages: string[] = [];
          
          for (const field in validationErrors) {
            if (validationErrors.hasOwnProperty(field)) {
              const messages = validationErrors[field];
              errorMessages.push(...messages);
            }
          }
          
          errorMsg = errorMessages.length > 0 
            ? errorMessages.join('. ') 
            : 'Please check your input and try again.';
        }
        // Handle custom error messages from backend service
        else if (error.error?.message) {
          errorMsg = error.error.message;
        }
        // Handle string error responses
        else if (typeof error.error === 'string') {
          errorMsg = error.error;
        }
        // Handle status-specific errors
        else if (error.status === 409) {
          errorMsg = 'User already exists. Please try a different email or username.';
        }
        else if (error.status === 0) {
          errorMsg = 'Unable to connect to server. Please check your connection.';
        }
        
        this.errorMessage.set(errorMsg);
      }
    });
  }
}
