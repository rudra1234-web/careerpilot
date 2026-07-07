import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { PracticeStateService } from '../../core/practice-state.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-mock-interview',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mock-interview.component.html',
})
export class MockInterviewComponent implements OnInit, OnDestroy {

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
  quotaRemaining: number | null = null;
  showJd = false;

  // Timer display
  secondsLeft = 0;
  private ticker?: ReturnType<typeof setInterval>;

  // Voice input
  listening = false;
  voiceSupported = false;
  private recognition: any;

  constructor(private api: ApiService,
              private auth: AuthService,
              public s: PracticeStateService,
              private toast: ToastService,
              private zone: NgZone) {
    this.userId = this.auth.userId;
  }

  ngOnInit(): void {
    this.api.myProfile().subscribe({
      next: p => {
        if (p.targetRole) this.targetRole = p.targetRole;
        if (p.skills) {
          this.profileSkills = p.skills;
          this.resumeSkills = p.skills.split(',').map(sk => sk.trim())
            .filter(sk => sk.length > 0).slice(0, 15);
        }
      },
      error: err => {
        // Do NOT fail silently: the user needs to know their resume skills
        // are unavailable, otherwise it looks like their data was lost.
        this.toast.error('Profile unavailable',
          'Could not load your resume skills (' + (err?.status || 'no connection') +
          '). Default topics only for now — is user-service running?');
      },
    });
    this.api.quota(this.userId).subscribe({
      next: q => this.quotaRemaining = q.remaining,
      error: () => { /* quota display is optional */ },
    });

    this.setupVoice();
    this.ticker = setInterval(() => this.secondsLeft = this.s.secondsLeft, 500);
    this.secondsLeft = this.s.secondsLeft;
  }

  ngOnDestroy(): void {
    if (this.ticker) clearInterval(this.ticker);
    this.stopVoice();
  }

  select(cat: string): void { this.s.category = cat; }

  start(): void {
    this.s.loading = true;
    this.api.generateQuestions(this.userId, this.targetRole, this.profileSkills,
        this.s.category, 5, this.s.jobDescription)
      .subscribe({
        next: qs => {
          this.s.questions = qs; this.s.current = 0; this.s.loading = false;
          this.s.startTimer();
          if (this.quotaRemaining !== null) this.quotaRemaining--;
        },
        error: err => {
          this.s.loading = false;
          this.toast.httpError(err, 'Could not generate questions. Is the backend running?');
        },
      });
  }

  submit(): void {
    const q = this.s.questions[this.s.current];
    this.s.loading = true;
    this.stopVoice();
    this.api.submitAnswer(q.id, this.s.answer).subscribe({
      next: fb => { this.s.feedback = fb; this.s.loading = false; },
      error: err => {
        this.s.loading = false;
        this.toast.httpError(err, 'Scoring failed — your answer is still in the box, try again.');
      },
    });
  }

  next(): void {
    this.s.feedback = undefined;
    this.s.answer = '';
    this.s.current++;
    if (this.s.inProgress) this.s.startTimer();
  }

  endSession(): void {
    this.stopVoice();
    this.s.reset();
  }

  get timerDisplay(): string {
    const m = Math.floor(this.secondsLeft / 60);
    const sec = this.secondsLeft % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  // ===== Voice input (browser speech recognition) =====
  private setupVoice(): void {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    this.voiceSupported = true;
    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.onresult = (e: any) => this.zone.run(() => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          this.s.answer = (this.s.answer + ' ' + e.results[i][0].transcript).trim();
        }
      }
    });
    this.recognition.onend = () => this.zone.run(() => this.listening = false);
    this.recognition.onerror = () => this.zone.run(() => this.listening = false);
  }

  toggleVoice(): void {
    if (!this.recognition) return;
    if (this.listening) { this.stopVoice(); return; }
    this.recognition.start();
    this.listening = true;
  }

  private stopVoice(): void {
    if (this.recognition && this.listening) this.recognition.stop();
    this.listening = false;
  }
}
