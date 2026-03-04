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
  {
    path: 'reader/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/reader/reader.page').then(m => m.ReaderPage)
  },
  { path: '**', redirectTo: 'tabs' },
];