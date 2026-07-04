import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero" style="text-align:center;padding:4rem 2rem">
      <span class="eyebrow">AI-powered interview preparation</span>
      <h1 style="font-size:2.6rem">Practice like it's the real interview.<br>Improve like you have a coach.</h1>
      <p style="margin:0 auto;max-width:620px">
        Upload your resume, get questions tailored to your actual experience, answer
        by voice or text, and receive interviewer-grade feedback with a personalized
        roadmap that adapts after every session.
      </p>
      <div style="display:flex;gap:1rem;justify-content:center;margin-top:2rem">
        <button class="btn" style="background:#fff;color:var(--brand-dark);font-size:1rem;padding:.8rem 1.8rem"
                (click)="auth.register()">Get started free</button>
        <button class="btn ghost" style="border-color:#a5b4fc;color:#c7d2fe;font-size:1rem;padding:.8rem 1.8rem"
                (click)="auth.login()">Sign in</button>
      </div>
    </section>

    <div class="grid-3">
      <div class="card">
        <div class="feature-icon">&#128196;</div>
        <h3>Resume-aware questions</h3>
        <p class="sub" style="margin:0">Our AI reads your resume and generates questions on the exact technologies you claim — just like a real interviewer would.</p>
      </div>
      <div class="card">
        <div class="feature-icon">&#127919;</div>
        <h3>Job-description targeting</h3>
        <p class="sub" style="margin:0">Paste a JD and practice the gap between what you know and what the role demands.</p>
      </div>
      <div class="card">
        <div class="feature-icon">&#129504;</div>
        <h3>Interviewer-grade feedback</h3>
        <p class="sub" style="margin:0">Every answer scored 1–10 with strengths, gaps, and a model answer. Timed questions and voice input included.</p>
      </div>
      <div class="card">
        <div class="feature-icon">&#128506;</div>
        <h3>Adaptive roadmap</h3>
        <p class="sub" style="margin:0">Weak areas tracked across sessions; your prep plan re-prioritizes automatically.</p>
      </div>
      <div class="card">
        <div class="feature-icon">&#128218;</div>
        <h3>Personal question bank</h3>
        <p class="sub" style="margin:0">Every question is saved with your answers and feedback — revisit and re-attempt any time.</p>
      </div>
      <div class="card">
        <div class="feature-icon">&#128274;</div>
        <h3>Private by design</h3>
        <p class="sub" style="margin:0">Your data is yours: per-account isolation, OIDC single sign-on, and full session control.</p>
      </div>
    </div>

    <div class="card" style="text-align:center;margin-top:2rem">
      <h3>Ready to practice?</h3>
      <p class="sub">Free tier includes 25 AI question generations per day.</p>
      <button class="btn" (click)="auth.register()">Create your account</button>
    </div>
  `,
})
export class LandingComponent implements OnInit {
  constructor(public auth: AuthService,
              private keycloak: KeycloakService,
              private router: Router) {}

  async ngOnInit(): Promise<void> {
    // Already signed in? Straight to the app.
    if (await this.keycloak.isLoggedIn()) this.router.navigate(['/dashboard']);
  }
}
