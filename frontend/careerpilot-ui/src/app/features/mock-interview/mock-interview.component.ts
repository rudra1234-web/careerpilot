import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { PracticeStateService } from '../../core/practice-state.service';

@Component({
  selector: 'app-mock-interview',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mock-interview.component.html',
})
export class MockInterviewComponent implements OnInit {

  static readonly CORE_CATEGORIES = [
    { id: 'DSA', label: 'Data Structures & Algorithms' },
    { id: 'SYSTEM_DESIGN', label: 'System Design' },
    { id: 'JAVA', label: 'Core Java' },
    { id: 'SPRING', label: 'Spring & Microservices' },
    { id: 'BEHAVIORAL', label: 'Behavioral' },
  ];

  readonly coreCategories = MockInterviewComponent.CORE_CATEGORIES;

  userId = '';
  resumeSkills: string[] = [];
  targetRole = 'Senior Software Engineer';
  profileSkills = 'Java, Spring Boot, Angular';

  constructor(private api: ApiService,
              private auth: AuthService,
              public s: PracticeStateService) {
    this.userId = this.auth.userId;
  }

  ngOnInit(): void {
    this.api.myProfile().subscribe({
      next: p => {
        if (p.targetRole) this.targetRole = p.targetRole;
        if (p.skills) {
          this.profileSkills = p.skills;
          this.resumeSkills = p.skills
            .split(',')
            .map(sk => sk.trim())
            .filter(sk => sk.length > 0)
            .slice(0, 15);
        }
      },
      error: () => { /* no profile yet - core categories still work */ },
    });
  }

  select(cat: string): void {
    this.s.category = cat;
  }

  start(): void {
    this.s.loading = true;
    this.api.generateQuestions(this.userId, this.targetRole, this.profileSkills, this.s.category)
      .subscribe({
        next: qs => { this.s.questions = qs; this.s.current = 0; this.s.loading = false; },
        error: () => { this.s.loading = false; },
      });
  }

  submit(): void {
    const q = this.s.questions[this.s.current];
    this.s.loading = true;
    this.api.submitAnswer(q.id, this.s.answer).subscribe({
      next: fb => { this.s.feedback = fb; this.s.loading = false; },
      error: () => { this.s.loading = false; },
    });
  }

  next(): void {
    this.s.feedback = undefined;
    this.s.answer = '';
    this.s.current++;
  }

  endSession(): void {
    this.s.reset();
  }
}
