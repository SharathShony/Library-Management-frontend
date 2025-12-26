import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  userId: string;
  username: string;
  email: string;
  role: string;
  token?: string | null;
}

interface SignupResponse {
  message: string;
  userId: string;
  username: string;
  email: string;
}

interface DecodedToken {
  exp?: number;
  userId?: string;
  email?: string;
  role?: string;
}

interface CurrentUserResponse {
  userId: string;
  username: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSignal = signal<boolean>(false);
  private userSignal = signal<any>(null);
  
  isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  currentUser = this.userSignal.asReadonly();

  private apiUrl = 'http://localhost:5164/api'; // Backend HTTP URL

  constructor(private http: HttpClient, private router: Router) {
    this.checkAuthStatus();
  }

  private checkAuthStatus() {
    const token = this.getToken();
    const user = this.getUser();
    
    if (token && user && !this.isTokenExpired(token)) {
      this.isAuthenticatedSignal.set(true);
      this.userSignal.set(user);
      // Don't make HTTP call here to avoid circular dependency
      // User data will be refreshed on next navigation or manual call
    } else {
      this.logout(false);
    }
  }

  // Get current user from backend
  getCurrentUserFromBackend(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(`${this.apiUrl}/Auth/me`);
  }

  // Refresh user data from backend (can be called manually)
  refreshUserData(): Observable<void> {
    return new Observable(observer => {
      this.getCurrentUserFromBackend().subscribe({
        next: (backendUser) => {
          const updatedUser = {
            id: backendUser.userId,
            email: backendUser.email,
            name: backendUser.username,
            username: backendUser.username,
            role: backendUser.role
          };
          this.userSignal.set(updatedUser);
          localStorage.setItem('userData', JSON.stringify(updatedUser));
          observer.next();
          observer.complete();
        },
        error: (error) => {
          console.error('Error refreshing user data:', error);
          observer.error(error);
        }
      });
    });
  }

  // Call your backend login API
  loginWithApi(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/Auth/login`, credentials).pipe(
      tap(response => {
        // Create user object from backend response
        const user = {
          id: response.userId,
          email: response.email,
          name: response.username,
          username: response.username,
          role: response.role
        };
        
        // Ensure token is present
        if (!response.token) {
          console.error('No token received from backend!');
          throw new Error('Authentication failed: No token received');
        }
        
        const token = response.token;
        
        this.storeAuthData(token, user);
        this.isAuthenticatedSignal.set(true);
        this.userSignal.set(user);
      })
    );
  }

  // Call your backend signup API
  signupWithApi(credentials: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.apiUrl}/Auth/signup`, credentials);
  }

  private storeAuthData(token: string, user: any) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
    
    // ADD THIS LINE - Store userId in sessionStorage for borrowing
    sessionStorage.setItem('userId', user.id);
  }

  login(token: string) {
    localStorage.setItem('authToken', token);
    this.isAuthenticatedSignal.set(true);
  }

  logout(navigate = true) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userId'); // ADD THIS LINE
    
    this.isAuthenticatedSignal.set(false);
    this.userSignal.set(null);
    
    if (navigate) {
      this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getUser(): any {
    const userData = localStorage.getItem('userData');
    if (!userData || userData === 'undefined') {
      return null;
    }
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return false;
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }

  private decodeToken(token: string): DecodedToken | null {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  hasRole(role: string): boolean {
    const user = this.userSignal();
    if (!user?.role) return false;
    // Case-insensitive comparison
    return user.role.toLowerCase() === role.toLowerCase();
  }
}
