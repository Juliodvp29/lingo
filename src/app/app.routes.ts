import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'tabs', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () =>
      import('./pages/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/onboarding/onboarding.page').then(m => m.OnboardingPage)
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    loadChildren: () =>
      import('./pages/tabs/tabs.routes').then(m => m.TABS_ROUTES)
  },
  { path: '**', redirectTo: 'tabs' },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then( m => m.ProfilePage)
  },
  {
    path: 'vocab',
    loadComponent: () => import('./pages/vocab/vocab.page').then( m => m.VocabPage)
  }
];