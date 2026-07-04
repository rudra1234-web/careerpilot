import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnsweredQuestion, ApiService, WeakArea } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h2>Your prep roadmap</h2>
    <p class="sub" style="margin-bottom:1.5rem">
      Weakest areas first — the agent re-prioritizes this after every practice session.
    </p>

    <div class="card" *ngIf="areas.length">
      <div class="area-row" *ngFor="let a of pagedAreas">
        <div class="area-name">
          {{ a.tag }}
          <div><span class="badge neutral" style="margin-top:.3rem">{{ a.category }}</span></div>
        </div>
        <div class="area-bar">
          <div [style.width.%]="a.avgScore * 10"
               [style.background]="a.avgScore >= 7 ? 'var(--success)' : a.avgScore >= 4 ? 'var(--warn)' : 'var(--danger)'">
          </div>
        </div>
        <div class="area-meta">
          <strong style="color:var(--ink)">{{ a.avgScore | number:'1.1-1' }}/10</strong><br>
          {{ a.attempts }} attempt{{ a.attempts === 1 ? '' : 's' }}
        </div>
      </div>

      <div class="pager" *ngIf="totalPages > 1">
        <button class="btn ghost" (click)="page = page - 1" [disabled]="page === 0">&larr; Previous</button>
        <span>Page {{ page + 1 }} of {{ totalPages }}</span>
        <button class="btn ghost" (click)="page = page + 1" [disabled]="page >= totalPages - 1">Next &rarr;</button>
      </div>
    </div>

    <div class="card empty-state" *ngIf="!areas.length">
      <div class="icon">&#128506;</div>
      <h3>No data yet</h3>
      <p>Complete a practice session and your personalized roadmap will appear here.</p>
      <a routerLink="/practice" class="btn" style="margin-top:.75rem">Start practicing</a>
    </div>

    <!-- ===== Practice history: revisit every Q&A with AI feedback ===== -->
    <div *ngIf="history.length" style="margin-top:2.5rem">
      <h2>Practice history</h2>
      <p class="sub" style="margin-bottom:1.5rem">
        Every question you've answered, with your answer and the AI's full feedback.
      </p>

      <details class="history-item" *ngFor="let h of pagedHistory">
        <summary>
          <span class="history-score"
                [style.background]="h.score >= 7 ? 'var(--success)' : h.score >= 4 ? 'var(--warn)' : 'var(--danger)'">
            {{ h.score }}
          </span>
          <span class="history-q">{{ h.question }}</span>
          <span class="history-meta">
            <span class="badge neutral">{{ h.category }}</span>
            <span class="history-date">{{ h.answeredAt | date:'MMM d, y, h:mm a' }}</span>
          </span>
        </summary>
        <div class="history-body">
          <h4>&#128221; Your answer</h4>
          <div class="improved" style="border-left-color:var(--ink-faint)">{{ h.userAnswer }}</div>

          <h4 style="margin-top:1.25rem">&#9989; Strengths</h4>
          <ul class="feedback-list"><li *ngFor="let st of h.strengths">{{ st }}</li></ul>

          <h4>&#9888;&#65039; Gaps</h4>
          <ul class="feedback-list"><li *ngFor="let g of h.gaps">{{ g }}</li></ul>

          <h4>&#128161; Improved answer</h4>
          <div class="improved">{{ h.improvedAnswer }}</div>

          <p class="sub" style="margin-top:1rem">Weak-area tag: <span class="chip">{{ h.weakAreaTag }}</span></p>
        </div>
      </details>

      <div class="pager" *ngIf="totalHistoryPages > 1">
        <button class="btn ghost" (click)="historyPage = historyPage - 1" [disabled]="historyPage === 0">&larr; Previous</button>
        <span>Page {{ historyPage + 1 }} of {{ totalHistoryPages }}</span>
        <button class="btn ghost" (click)="historyPage = historyPage + 1" [disabled]="historyPage >= totalHistoryPages - 1">Next &rarr;</button>
      </div>
    </div>
  `,
})
export class RoadmapComponent implements OnInit {
  private static readonly PAGE_SIZE = 8;
  private static readonly HISTORY_PAGE_SIZE = 5;

  areas: WeakArea[] = [];
  history: AnsweredQuestion[] = [];
  page = 0;
  historyPage = 0;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.api.weakAreas(this.auth.userId).subscribe({
      next: a => this.areas = a,
      error: () => this.areas = [],
    });
    this.api.history(this.auth.userId).subscribe({
      next: h => this.history = h,
      error: () => this.history = [],
    });
  }

  get totalPages(): number {
    return Math.ceil(this.areas.length / RoadmapComponent.PAGE_SIZE);
  }

  get pagedAreas(): WeakArea[] {
    const start = this.page * RoadmapComponent.PAGE_SIZE;
    return this.areas.slice(start, start + RoadmapComponent.PAGE_SIZE);
  }

  get totalHistoryPages(): number {
    return Math.ceil(this.history.length / RoadmapComponent.HISTORY_PAGE_SIZE);
  }

  get pagedHistory(): AnsweredQuestion[] {
    const start = this.historyPage * RoadmapComponent.HISTORY_PAGE_SIZE;
    return this.history.slice(start, start + RoadmapComponent.HISTORY_PAGE_SIZE);
  }
}
