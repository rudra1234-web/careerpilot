import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AnsweredQuestion, ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { PracticeStateService } from '../../core/practice-state.service';

/**
 * OnPush + server-side pagination: the component re-renders only when we
 * explicitly mark it (after each fetch), and each page is one small API call
 * instead of downloading the user's entire question history.
 */
@Component({
  selector: 'app-question-bank',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Question bank</h2>
    <p class="sub" style="margin-bottom:1.5rem">
      Every question generated for you — re-attempt any of them without using your daily quota.
    </p>

    <div *ngIf="loading">
      <div class="skeleton" style="height:72px;margin-bottom:.9rem" *ngFor="let i of [1,2,3,4]"></div>
    </div>

    <ng-container *ngIf="!loading">
      <div class="card" style="padding:0" *ngIf="questions.length">
        <div class="bank-row" *ngFor="let q of questions">
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
        <button class="btn ghost" (click)="load(page - 1)" [disabled]="page === 0">&larr; Previous</button>
        <span>Page {{ page + 1 }} of {{ totalPages }} &middot; {{ totalElements }} questions</span>
        <button class="btn ghost" (click)="load(page + 1)" [disabled]="page >= totalPages - 1">Next &rarr;</button>
      </div>

      <div class="card empty-state" *ngIf="!questions.length">
        <div class="icon">&#128218;</div>
        <h3>No questions yet</h3>
        <p>Run a practice session and every generated question lands here for later review.</p>
      </div>
    </ng-container>
  `,
})
export class QuestionBankComponent implements OnInit {
  questions: AnsweredQuestion[] = [];
  loading = true;
  page = 0;
  totalPages = 0;
  totalElements = 0;

  constructor(private api: ApiService,
              private auth: AuthService,
              private practice: PracticeStateService,
              private router: Router,
              private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(0); }

  load(page: number): void {
    this.loading = page === 0 && this.questions.length === 0;
    this.api.bank(this.auth.userId, page, 8).subscribe({
      next: p => {
        this.questions = p.content;
        this.page = p.number;
        this.totalPages = p.totalPages;
        this.totalElements = p.totalElements;
        this.loading = false;
        this.cd.markForCheck();
      },
      error: () => { this.questions = []; this.loading = false; this.cd.markForCheck(); },
    });
  }

  /** Load this single question into a practice session - no API cost. */
  reattempt(q: AnsweredQuestion): void {
    this.practice.reset();
    this.practice.category = q.category;
    this.practice.questions = [q];
    this.router.navigate(['/practice']);
  }
}
