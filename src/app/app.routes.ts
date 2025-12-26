import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Signup } from './features/signup/signup';
import { Home } from './features/home/home';
import { Dashboard } from './features/dashboard/dashboard';
import { UserManagement } from './features/user-management/user-management';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
    { path: 'login', component: Login, canActivate: [noAuthGuard] },
    { path: 'signup', component: Signup, canActivate: [noAuthGuard] },
    { path: 'home', component: Home, canActivate: [authGuard] },
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
    { path: 'user-management', component: UserManagement, canActivate: [authGuard] },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];
