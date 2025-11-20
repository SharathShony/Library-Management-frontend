import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Signal to track authentication state
  private isAuthenticatedSignal = signal<boolean>(false);
  
  // Public readonly signal
  isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  constructor() {
    // Check if user is already logged in (e.g., from localStorage)
    const token = localStorage.getItem('authToken');
    if (token) {
      this.isAuthenticatedSignal.set(true);
    }
  }

  login(token: string) {
    localStorage.setItem('authToken', token);
    this.isAuthenticatedSignal.set(true);
  }

  logout() {
    localStorage.removeItem('authToken');
    this.isAuthenticatedSignal.set(false);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }
}
