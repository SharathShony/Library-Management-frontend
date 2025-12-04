import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Signup } from './features/signup/signup';
import { Home } from './features/home/home';
import { Dashboard } from './features/dashboard/dashboard';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'signup', component: Signup },
    { path: 'home', component: Home },
    { path: 'dashboard', component: Dashboard },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];
