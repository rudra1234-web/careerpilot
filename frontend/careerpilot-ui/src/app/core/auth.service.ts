import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';

/**
 * Auth facade over Keycloak: exposes the logged-in identity, logout, and two
 * auto-logout mechanisms:
 *  1. Token expiry: if the refresh token can no longer renew the session,
 *     the user is logged out immediately.
 *  2. Idle timeout: after IDLE_LIMIT_MS without user activity a 60-second
 *     warning toast appears; if the user does not respond, the session ends.
 *
 * On every login it also POSTs /api/users/sync so the name chosen at signup
 * is persisted in the user-service database (PostgreSQL).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private static readonly IDLE_LIMIT_MS = 14 * 60 * 1000; // warn after 14 min idle
  private static readonly WARNING_SECONDS = 60;           // then 60s grace

  private idleTimer?: ReturnType<typeof setTimeout>;
  private countdownTimer?: ReturnType<typeof setInterval>;

  displayName = '';
  username = '';
  email = '';
  userId = '';

  /** Expiry-warning toast state (bound in AppComponent). */
  showExpiryWarning = false;
  warningSecondsLeft = AuthService.WARNING_SECONDS;

  constructor(private keycloak: KeycloakService,
              private zone: NgZone,
              private http: HttpClient) {}

  /** Called once from AppComponent after Keycloak init. */
  async start(): Promise<void> {
    const instance = this.keycloak.getKeycloakInstance();
    const token = instance.tokenParsed as Record<string, string> | undefined;

    // Read identity straight from the parsed token. (KeycloakService.getUsername()
    // throws unless loadUserProfile() ran first, which aborted this method and
    // left userId empty - events then reached Kafka without an owner.)
    this.userId = instance.subject ?? '';
    this.username = token?.['preferred_username'] ?? this.userId;
    this.email = token?.['email'] ?? '';
    this.displayName =
      token?.['name'] || token?.['given_name'] || this.username;

    // Persist/refresh the profile row in user-service (name from signup).
    this.http.post<{ fullName?: string }>('http://localhost:8080/api/users/sync', {})
      .subscribe({
        next: p => { if (p?.fullName) this.displayName = p.fullName; },
        error: () => { /* backend down: token name is still shown */ },
      });

    // 1. Auto-logout when the session can no longer be refreshed.
    instance.onTokenExpired = () => {
      this.keycloak.updateToken(30).catch(() => this.logout());
    };
    instance.onAuthRefreshError = () => this.logout();

    // 2. Idle timeout, listeners registered outside Angular for performance.
    this.zone.runOutsideAngular(() => {
      ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
        .forEach(evt => window.addEventListener(evt, this.onActivity, { passive: true }));
      this.resetIdleTimer();
    });
  }

  private onActivity = (): void => {
    // Activity during the warning does NOT dismiss it — the user must
    // explicitly choose "Stay signed in" (prevents accidental extensions).
    if (this.showExpiryWarning) return;
    this.resetIdleTimer();
  };

  private resetIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(
      () => this.zone.run(() => this.beginWarning()),
      AuthService.IDLE_LIMIT_MS);
  }

  private beginWarning(): void {
    this.showExpiryWarning = true;
    this.warningSecondsLeft = AuthService.WARNING_SECONDS;
    this.countdownTimer = setInterval(() => this.zone.run(() => {
      this.warningSecondsLeft--;
      if (this.warningSecondsLeft <= 0) this.logout();
    }), 1000);
  }

  /** "Stay signed in" button on the toast. */
  staySignedIn(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.showExpiryWarning = false;
    this.keycloak.updateToken(60).catch(() => this.logout());
    this.resetIdleTimer();
  }

  get initials(): string {
    return this.displayName
      .split(/\s+/)
      .map(p => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('') || 'U';
  }

  logout(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.keycloak.logout(window.location.origin);
  }
}
