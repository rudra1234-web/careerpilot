import { Injectable } from '@angular/core';

export interface Toast {
  id: number;
  type: 'error' | 'success' | 'info';
  title: string;
  message: string;
}

/** App-wide toast notifications (errors, confirmations). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts: Toast[] = [];
  private seq = 0;

  show(type: Toast['type'], title: string, message: string, ttlMs = 6000): void {
    const toast: Toast = { id: ++this.seq, type, title, message };
    this.toasts.push(toast);
    setTimeout(() => this.dismiss(toast.id), ttlMs);
  }

  error(title: string, message: string): void { this.show('error', title, message, 8000); }
  success(title: string, message: string): void { this.show('success', title, message); }

  dismiss(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  /** Friendly message from an HttpErrorResponse. */
  httpError(err: any, fallback: string): void {
    const msg = err?.error?.message || err?.message || fallback;
    this.error(err?.status === 429 ? 'Daily limit reached' : 'Something went wrong',
               err?.status === 429 ? msg : fallback);
  }
}
