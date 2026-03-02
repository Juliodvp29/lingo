import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    //loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
   //loadComponent: () => import('./register/register.page').then(m => m.RegisterPage)
  }
];