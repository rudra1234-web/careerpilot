import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MockInterviewComponent } from './features/mock-interview/mock-interview.component';
import { RoadmapComponent } from './features/roadmap/roadmap.component';
import { QuestionBankComponent } from './features/question-bank/question-bank.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'practice', component: MockInterviewComponent, canActivate: [authGuard] },
  { path: 'bank', component: QuestionBankComponent, canActivate: [authGuard] },
  { path: 'roadmap', component: RoadmapComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
