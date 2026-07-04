import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AnsweredQuestion, ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="hero">
      <span class="eyebrow">AI-powered interview prep</span>
      <h1>Welcome back, {{ auth.displayName.split(' ')[0] || 'there' }}.<br>Ready for your next session?</h1>
      <p>Upload your resume, practice AI-generated interview questions tailored
         to your profile, and let the agent plan exactly what to work on next.</p>
    </section>

    <!-- Onboarding: shown until a target role is set -->
    <div class="card onboarding" *ngIf="showOnboarding">
      <h3>&#127919; Set your target</h3>
      <p class="sub">Questions get sharper when we know what you're aiming for.</p>
      <div class="onboarding-grid">
        <div class="field" style="margin:0">
          <label>Target role</label>
          <input type="text" [(ngModel)]="prefRole" placeholder="e.g. Senior Java Developer">
        </div>
        <div class="field" style="margin:0">
          <label>Years of experience</label>
          <input type="text" [(ngModel)]="prefYears" placeholder="e.g. 7">
        </div>
        <div class="field" style="margin:0">
          <label>Company type</label>
          <select [(ngModel)]="prefCompany">
            <option value="product">Product</option>
            <option value="service">Service</option>
            <option value="startup">Startup</option>
          </select>
        </div>
      </div>
      <button class="btn" style="margin-top:1rem" (click)="savePrefs()" [disabled]="!prefRole">Save</button>
    </div>

    <!-- Progress at a glance -->
    <div class="stats-row" *ngIf="statsLoading">
      <div class="skeleton stat-skel" *ngFor="let i of [1,2,3,4]"></div>
    </div>
    <div class="stats-row" *ngIf="!statsLoading && answered.length">
      <div class="stat-card">
        <span class="stat-value">{{ answered.length }}</span>
        <span class="stat-label">Questions answered</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ avgScore | number:'1.1-1' }}<span class="stat-unit">/10</span></span>
        <span class="stat-label">Average score</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" [style.color]="trend >= 0 ? 'var(--success)' : 'var(--danger)'">
          {{ trend >= 0 ? '▲' : '▼' }} {{ trendAbs | number:'1.1-1' }}
        </span>
        <span class="stat-label">Last 5 vs previous</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ bestCategory }}</span>
        <span class="stat-label">Strongest topic</span>
      </div>
    </div>

    <div class="card">
      <h3>Upload your resume</h3>
      <p class="sub">PDF, PNG or JPG &middot; our AI reads it and builds your skill profile</p>

      <label class="upload-zone">
        <input type="file" (change)="onFile($event)" accept=".pdf,.png,.jpg,.jpeg" />
        <div class="icon">&#128196;</div>
        <div *ngIf="!uploading"><strong>Click to choose a file</strong><br>
          <span style="color:var(--ink-faint);font-size:.85rem">PDF and images supported, up to 5 MB</span>
        </div>
        <div *ngIf="uploading"><strong>Analyzing your resume&hellip;</strong></div>
      </label>

      <div *ngIf="skillsLoading" class="chips" style="margin-top:1.5rem">
        <span class="skeleton chip-skel" *ngFor="let i of [1,2,3,4,5,6]"></span>
      </div>

      <div *ngIf="!skillsLoading && skills.length">
        <h4 style="margin-top:1.5rem">
          {{ fromSavedProfile ? 'Your skills on file' : 'Detected skills' }}
        </h4>
        <p class="sub" *ngIf="fromSavedProfile" style="margin-bottom:.5rem">
          From your last resume upload &mdash; upload a new resume any time to refresh them.
        </p>
        <div class="chips">
          <span class="chip" *ngFor="let s of skills">{{ s }}</span>
        </div>
      </div>
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="feature-icon">&#127919;</div>
        <h3>Tailored questions</h3>
        <p class="sub" style="margin:0">DSA, system design, Java, Spring and behavioral questions calibrated to your resume and target role.</p>
        <a routerLink="/practice" class="btn ghost" style="margin-top:1rem">Start practice</a>
      </div>
      <div class="card">
        <div class="feature-icon">&#128218;</div>
        <h3>Question bank</h3>
        <p class="sub" style="margin:0">Every generated question saved for review — re-attempt any of them free of quota.</p>
        <a routerLink="/bank" class="btn ghost" style="margin-top:1rem">Browse questions</a>
      </div>
      <div class="card">
        <div class="feature-icon">&#128506;</div>
        <h3>Adaptive roadmap</h3>
        <p class="sub" style="margin:0">Weak areas tracked across sessions; the plan re-prioritizes after every practice run.</p>
        <a routerLink="/roadmap" class="btn ghost" style="margin-top:1rem">View roadmap</a>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  skills: string[] = [];
  fromSavedProfile = false;
  uploading = false;
  skillsLoading = true;
  statsLoading = true;

  answered: AnsweredQuestion[] = [];
  showOnboarding = false;
  prefRole = '';
  prefYears = '';
  prefCompany = 'product';

  constructor(private api: ApiService, public auth: AuthService,
              private toast: ToastService) {}

  ngOnInit(): void {
    this.api.myProfile().subscribe({
      next: p => {
        this.skillsLoading = false;
        if (p.skills && !this.skills.length) {
          this.skills = p.skills.split(',').map(s => s.trim()).filter(Boolean);
          this.fromSavedProfile = true;
        }
        this.showOnboarding = !p.targetRole;
      },
      error: () => { this.skillsLoading = false; this.showOnboarding = true; },
    });
    this.api.history(this.auth.userId).subscribe({
      next: h => { this.answered = h; this.statsLoading = false; },
      error: () => { this.statsLoading = false; },
    });
  }

  get avgScore(): number {
    if (!this.answered.length) return 0;
    return this.answered.reduce((a, q) => a + (q.score || 0), 0) / this.answered.length;
  }

  /** Average of the 5 most recent scores minus the 5 before that. */
  get trend(): number {
    const recent = this.answered.slice(0, 5);
    const prev = this.answered.slice(5, 10);
    if (!recent.length || !prev.length) return 0;
    const avg = (arr: AnsweredQuestion[]) => arr.reduce((a, q) => a + (q.score || 0), 0) / arr.length;
    return avg(recent) - avg(prev);
  }

  get trendAbs(): number { return Math.abs(this.trend); }

  get bestCategory(): string {
    const byCat = new Map<string, number[]>();
    this.answered.forEach(q => {
      if (!byCat.has(q.category)) byCat.set(q.category, []);
      byCat.get(q.category)!.push(q.score || 0);
    });
    let best = '—', bestAvg = -1;
    byCat.forEach((scores, cat) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > bestAvg) { bestAvg = avg; best = cat; }
    });
    return best;
  }

  savePrefs(): void {
    const years = parseInt(this.prefYears, 10);
    this.api.savePreferences({
      targetRole: this.prefRole,
      targetCompanyType: this.prefCompany,
      yearsOfExperience: isNaN(years) ? undefined : years,
    }).subscribe({
      next: () => {
        this.showOnboarding = false;
        this.toast.success('Saved', 'Your questions will now target ' + this.prefRole + '.');
      },
      error: err => this.toast.httpError(err, 'Could not save preferences.'),
    });
  }

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading = true;
    this.api.uploadResume(this.auth.userId, file).subscribe({
      next: res => {
        this.skills = res.detectedSkills ?? [];
        this.fromSavedProfile = false;
        this.uploading = false;
        this.toast.success('Resume analyzed', this.skills.length + ' skills detected and saved to your profile.');
      },
      error: err => {
        this.uploading = false;
        this.toast.httpError(err, 'Resume upload failed. Is the backend running?');
      },
    });
  }
}
