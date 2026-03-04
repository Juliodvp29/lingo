import { Routes } from '@angular/router';

export const TABS_ROUTES: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('../home/home.page').then(m => m.HomePage)
  },
  {
    path: 'vocab',
    loadComponent: () =>
      import('../vocab/vocab.page').then(m => m.VocabPage)
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('../profile/profile.page').then(m => m.ProfilePage)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  }
];