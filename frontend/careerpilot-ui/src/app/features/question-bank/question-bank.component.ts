import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AnsweredQuestion, ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { PracticeStateService } from '../../core/practice-state.service';

@Component({
  selector: 'app-question-bank',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Question bank</h2>
    <p class="sub" style="margin-bottom:1.5rem">
      Every question generated for you — re-attempt any of them without using your daily quota.
    </p>

    <!-- Loading skeleton -->
    <div *ngIf="loading">
      <div class="skeleton" style="height:72px;margin-bottom:.9rem" *ngFor="let i of [1,2,3,4]"></div>
    </div>

    <ng-container *ngIf="!loading">
      <div class="chips" style="margin-bottom:1.25rem" *ngIf="categories.length > 1">
        <button type="button" class="chip choice" [class.active]="filter === ''"
                (click)="filter = ''; page = 0">All ({{ questions.length }})</button>
        <button type="button" class="chip choice" *ngFor="let c of categories"
                [class.active]="filter === c"
                (click)="filter = c; page = 0">{{ c }}</button>
      </div>

      <div class="card" style="padding:0" *ngIf="filtered.length">
        <div class="bank-row" *ngFor="let q of paged">
          <div style="flex:1">
            <p class="bank-q">{{ q.question }}</p>
            <div style="display:flex;gap:.5rem;align-items:center;margin-top:.4rem">
              <span class="badge neutral">{{ q.category }}</span>
              <span class="badge" [class]="'badge ' + (q.difficulty || 'medium').toLowerCase()">{{ q.difficulty }}</span>
              <span class="badge success" *ngIf="q.answeredAt">Answered &middot; {{ q.score }}/10</span>
              <span class="badge warn" *ngIf="!q.answeredAt">Not attempted</span>
            </div>
          </div>
          <button class="btn ghost" (click)="reattempt(q)">
            {{ q.answeredAt ? 'Re-attempt' : 'Attempt' }}
          </button>
        </div>
      </div>

      <div class="pager" *ngIf="totalPages > 1">
        <button class="btn ghost" (click)="page = page - 1" [disabled]="page === 0">&larr; Previous</button>
        <span>Page {{ page + 1 }} of {{ totalPages }}</span>
        <button class="btn ghost" (click)="page = page + 1" [disabled]="page >= totalPages - 1">Next &rarr;</button>
      </div>

      <div class="card empty-state" *ngIf="!filtered.length">
        <div class="icon">&#128218;</div>
        <h3>No questions yet</h3>
        <p>Run a practice session and every generated question lands here for later review.</p>
      </div>
    </ng-container>
  `,
})
export class QuestionBankComponent implements OnInit {
  private static readonly PAGE_SIZE = 8;

  questions: AnsweredQuestion[] = [];
  loading = true;
  filter = '';
  page = 0;

  constructor(private api: ApiService,
              private auth: AuthService,
              private practice: PracticeStateService,
              private router: Router) {}

  ngOnInit(): void {
    this.api.bank(this.auth.userId).subscribe({
      next: q => { this.questions = q; this.loading = false; },
      error: () => { this.questions = []; this.loading = false; },
    });
  }

  get categories(): string[] {
    return [...new Set(this.questions.map(q => q.category))];
  }

  get filtered(): AnsweredQuestion[] {
    return this.filter ? this.questions.filter(q => q.category === this.filter) : this.questions;
  }

  get totalPages(): number {
    return Math.ceil(this.filtered.length / QuestionBankComponent.PAGE_SIZE);
  }

  get paged(): AnsweredQuestion[] {
    const start = this.page * QuestionBankComponent.PAGE_SIZE;
    return this.filtered.slice(start, start + QuestionBankComponent.PAGE_SIZE);
  }

  /** Load this single question into a practice session - no API cost. */
  reattempt(q: AnsweredQuestion): void {
    this.practice.reset();
    this.practice.category = q.category;
    this.practice.questions = [q];
    this.router.navigate(['/practice']);
  }
}
