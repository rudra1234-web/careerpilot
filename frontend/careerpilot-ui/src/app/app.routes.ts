import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MockInterviewComponent } from './features/mock-interview/mock-interview.component';
import { RoadmapComponent } from './features/roadmap/roadmap.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'practice', component: MockInterviewComponent },
  { path: 'roadmap', component: RoadmapComponent },
];
