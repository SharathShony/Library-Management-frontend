import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  onSubmit(event: Event, email: string, password: string) {
    event.preventDefault();
    console.log('Form submitted!', { email, password });
    
    // Accept any email and password for now (demo mode)
    if (!email || !password) {
      console.log('Email or password is empty');
      return;
    }
    
    // Create a demo token
    const fakeToken = btoa(`${email}:${Date.now()}`);
    console.log('Generated token:', fakeToken);
    
    this.auth.login(fakeToken);
    console.log('Auth state after login:', this.auth.isAuthenticated());
    
    this.router.navigate(['/home']);
    console.log('Navigation triggered to /home');
  }
}
