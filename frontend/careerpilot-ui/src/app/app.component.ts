import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-inner">
        <a routerLink="/" class="brand">
          <span class="brand-mark">CP</span>
          CareerPilot
        </a>
        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Dashboard</a>
          <a routerLink="/practice" routerLinkActive="active">Practice</a>
          <a routerLink="/roadmap" routerLinkActive="active">Roadmap</a>
        </div>
        <div class="user-menu">
          <button class="btn-icon" (click)="toggleTheme()"
                  [title]="dark ? 'Switch to light mode' : 'Switch to dark mode'">
            {{ dark ? '☀️' : '🌙' }}
          </button>
          <div class="identity">
            <span class="avatar">{{ auth.initials }}</span>
            <span class="identity-text">
              <span class="user-name">{{ auth.displayName }}</span>
              <span class="user-sub">{{ auth.email || auth.username }}</span>
            </span>
          </div>
          <button class="btn-logout" (click)="auth.logout()" title="Sign out">Logout</button>
        </div>
      </div>
    </nav>

    <main class="page">
      <router-outlet></router-outlet>
    </main>

    <footer class="footer">
      CareerPilot &mdash; AI-powered interview preparation &middot; &copy; 2026 CareerPilot
    </footer>

    <!-- Session-expiry warning toast -->
    <div class="toast" *ngIf="auth.showExpiryWarning">
      <div class="toast-icon">&#9200;</div>
      <div class="toast-body">
        <strong>Still there?</strong>
        <p>You'll be signed out in {{ auth.warningSecondsLeft }}s due to inactivity.</p>
      </div>
      <div class="toast-actions">
        <button class="btn" (click)="auth.staySignedIn()">Stay signed in</button>
        <button class="btn-logout" (click)="auth.logout()">Sign out</button>
      </div>
    </div>
  `,
})
export class AppComponent implements OnInit {
  dark = false;

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    this.auth.start();
    this.dark = localStorage.getItem('cp-theme') === 'dark';
    this.applyTheme();
  }

  toggleTheme(): void {
    this.dark = !this.dark;
    localStorage.setItem('cp-theme', this.dark ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.dark ? 'dark' : 'light');
  }
}
