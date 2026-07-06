import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

/**
 * Lazy-loaded routes: each page compiles to its own JS chunk, downloaded on
 * first visit. Initial bundle carries only the shell + landing page.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component')
      .then(m => m.LandingComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
  },
  {
    path: 'practice',
    canActivate: [authGuard],
    loadComponent: () => import('./features/mock-interview/mock-interview.component')
      .then(m => m.MockInterviewComponent),
  },
  {
    path: 'bank',
    canActivate: [authGuard],
    loadComponent: () => import('./features/question-bank/question-bank.component')
      .then(m => m.QuestionBankComponent),
  },
  {
    path: 'roadmap',
    canActivate: [authGuard],
    loadComponent: () => import('./features/roadmap/roadmap.component')
      .then(m => m.RoadmapComponent),
  },
  { path: '**', redirectTo: '' },
];
