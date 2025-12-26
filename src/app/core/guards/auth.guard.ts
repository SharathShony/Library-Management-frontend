import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  
  // Check if token exists and is not expired
  if (token && !isTokenExpired(token)) {
    return true;
  }

  // Token is missing or expired - logout and redirect
  authService.logout(false);
  router.navigate(['/login']);
  return false;
};

function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    if (!decoded.exp) return false;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}
