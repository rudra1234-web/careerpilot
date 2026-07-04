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
                    category: string, count = 5): Observable<InterviewQuestion[]> {
    return this.http.post<InterviewQuestion[]>(`${this.base}/questions/generate`,
      { userId, targetRole, skills, category, count });
  }

  submitAnswer(questionId: string, answer: string): Observable<AnswerFeedback> {
    return this.http.post<AnswerFeedback>(
      `${this.base}/questions/${questionId}/feedback`, { answer });
  }

  weakAreas(userId: string): Observable<WeakArea[]> {
    return this.http.get<WeakArea[]>(`${this.base}/progress/${userId}/weak-areas`);
  }

  /** Every answered question with answer + feedback, newest first. */
  history(userId: string): Observable<AnsweredQuestion[]> {
    return this.http.get<AnsweredQuestion[]>(`${this.base}/questions/history?userId=${userId}`);
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
}

export interface UserProfile {
  fullName?: string;
  email?: string;
  targetRole?: string;
  skills?: string;   // comma-separated, extracted from the resume
}
