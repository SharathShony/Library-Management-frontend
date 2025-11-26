import { Component, inject, OnInit, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  authService = inject(AuthService);
  private router = inject(Router);

  // Use computed signals that react to AuthService changes
  userName = computed(() => {
    const user = this.authService.currentUser();
    return user?.name || user?.username || 'User';
  });

  userRole = computed(() => {
    const user = this.authService.currentUser();
    return user?.role || 'Guest';
  });

  handleLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
