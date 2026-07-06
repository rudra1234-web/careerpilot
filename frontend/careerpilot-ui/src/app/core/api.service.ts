import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  difficulty: string;
}

/** An answered question with the user's answer + AI feedback (practice history). */
export interface AnsweredQuestion extends InterviewQuestion {
  userAnswer: string;
  score: number;
  strengths: string[];
  gaps: string[];
  improvedAnswer: string;
  weakAreaTag: string;
  answeredAt: string;
}

export interface AnswerFeedback {
  score: number;
  strengths: string[];
  gaps: string[];
  improvedAnswer: string;
  weakAreaTag: string;
}

export interface WeakArea {
  tag: string;
  category: string;
  avgScore: number;
  attempts: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  generateQuestions(userId: string, targetRole: string, skills: string,
                    category: string, count = 5, jobDescription = ''): Observable<InterviewQuestion[]> {
    return this.http.post<InterviewQuestion[]>(`${this.base}/questions/generate`,
      { userId, targetRole, skills, category, count, jobDescription });
  }

  submitAnswer(questionId: string, answer: string): Observable<AnswerFeedback> {
    return this.http.post<AnswerFeedback>(
      `${this.base}/questions/${questionId}/feedback`, { answer });
  }

  weakAreas(userId: string): Observable<WeakArea[]> {
    return this.http.get<WeakArea[]>(`${this.base}/progress/${userId}/weak-areas`);
  }

  /** Every answered question with answer + feedback, newest first (paged). */
  history(userId: string, page = 0, size = 5): Observable<PageResp<AnsweredQuestion>> {
    return this.http.get<PageResp<AnsweredQuestion>>(
      `${this.base}/questions/history?userId=${userId}&page=${page}&size=${size}`);
  }

  uploadResume(userId: string, file: File): Observable<any> {
    const form = new FormData();
    form.append('userId', userId);
    form.append('file', file);
    return this.http.post(`${this.base}/resumes/upload`, form);
  }

  /** Profile stored in user-service (name, target role, resume skills). */
  myProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/users/me`);
  }

  /** Onboarding preferences: never touches skills or identity. */
  savePreferences(prefs: { targetRole?: string; targetCompanyType?: string;
                           yearsOfExperience?: number }): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.base}/users/me/preferences`, prefs);
  }

  /** Every question ever generated for this user, newest first (paged). */
  bank(userId: string, page = 0, size = 8): Observable<PageResp<AnsweredQuestion>> {
    return this.http.get<PageResp<AnsweredQuestion>>(
      `${this.base}/questions/bank?userId=${userId}&page=${page}&size=${size}`);
  }

  /** Remaining daily generation quota. */
  quota(userId: string): Observable<{ limit: number; used: number; remaining: number }> {
    return this.http.get<{ limit: number; used: number; remaining: number }>(
      `${this.base}/questions/quota?userId=${userId}`);
  }
}

/** Spring Data page envelope. */
export interface PageResp<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;   // current page index
}

export interface UserProfile {
  fullName?: string;
  email?: string;
  targetRole?: string;
  targetCompanyType?: string;
  yearsOfExperience?: number;
  skills?: string;   // comma-separated, extracted from the resume
}
