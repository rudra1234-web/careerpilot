import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
      <span class="eyebrow">AI-powered interview prep</span>
      <h1>Welcome back, {{ auth.displayName.split(' ')[0] || 'there' }}.<br>Ready for your next session?</h1>
      <p>Upload your resume, practice AI-generated interview questions tailored
         to your profile, and let the agent plan exactly what to work on next.</p>
    </section>

    <div class="card">
      <h3>Upload your resume</h3>
      <p class="sub">PDF, PNG or JPG &middot; our AI reads it and builds your skill profile</p>

      <label class="upload-zone">
        <input type="file" (change)="onFile($event)" accept=".pdf,.png,.jpg,.jpeg" />
        <div class="icon">&#128196;</div>
        <div *ngIf="!uploading"><strong>Click to choose a file</strong><br>
          <span style="color:var(--ink-faint);font-size:.85rem">PDF and 