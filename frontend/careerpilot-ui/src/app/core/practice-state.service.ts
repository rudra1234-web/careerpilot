import { Injectable } from '@angular/core';
import { InterviewQuestion, AnswerFeedback } from './api.service';

/**
 * Holds the in-progress practice session OUTSIDE the component tree.
 * Angular destroys routed components on navigation; by keeping session state
 * in a root-provided service, the user can check the Roadmap or Dashboard
 * mid-session and return exactly where they left off - current question,
 * half-typed answer, feedback and all.
 */
@Injectable({ providedIn: 'root' })
export class PracticeStateService {
  category = 'DSA';
  questions: InterviewQuestion[] = [];
  current = 0;
  answer = '';
  feedback?: AnswerFeedback;
  loading = false;

  get inProgress(): boolean {
    return this.questions.length > 0 && this.current < this.questions.length;
  }

  reset(): void {
    this.questions = [];
    this.current = 0;
    this.answer = '';
    this.feedback = undefined;
    this.loading = false;
  }
}
