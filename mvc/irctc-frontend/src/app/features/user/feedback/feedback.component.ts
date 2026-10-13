import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { FeedbackService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { FeedbackResponse } from '../../../core/models/booking.model';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [FormsModule, SlicePipe],
  template: `
    <div class="page-header">
      <h2>💬 My Feedback</h2>
    </div>

    <div class="feedback-layout">
      <!-- Submit Form -->
      <div class="form-card">
        <h3>Submit Feedback</h3>
        <form (ngSubmit)="submit()" class="feedback-form">
          <div class="form-group">
            <label>Title</label>
            <input [(ngModel)]="form.title" name="title" placeholder="Brief title" required class="form-control" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea [(ngModel)]="form.description" name="desc" rows="4" placeholder="Your feedback..." required class="form-control"></textarea>
          </div>
          <div class="form-group">
            <label>Rating</label>
            <div class="stars">
              @for (star of [1,2,3,4,5]; track star) {
                <span class="star" [class.active]="form.rating >= star" (click)="form.rating = star">★</span>
              }
            </div>
          </div>
          @if (submitError()) {
            <div class="alert alert-error">{{ submitError() }}</div>
          }
          @if (submitSuccess()) {
            <div class="alert alert-success">✅ Thank you for your feedback!</div>
          }
          <button type="submit" class="btn-submit" [disabled]="submitting()">
            {{ submitting() ? 'Submitting...' : 'Submit Feedback' }}
          </button>
        </form>
      </div>

      <!-- My Feedbacks -->
      <div class="list-card">
        <h3>My Previous Feedbacks</h3>
        @if (loading()) { <p class="loading">Loading...</p> }
        @if (!loading() && myFeedbacks().length === 0) {
          <p class="empty">No feedbacks yet.</p>
        }
        @for (fb of myFeedbacks(); track fb.id) {
          <div class="feedback-item">
            <div class="fb-header">
              <strong>{{ fb.title }}</strong>
              <div class="rating-display">
                {{ '★'.repeat(fb.rating) }}{{ '☆'.repeat(5 - fb.rating) }}
              </div>
            </div>
            <p class="fb-desc">{{ fb.description }}</p>
            <span class="fb-date">{{ fb.createdAt | slice:0:10 }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header h2 { color:#1a237e; font-size:1.8rem; margin-bottom:1.5rem; }
    .feedback-layout { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; }
    @media (max-width: 768px) { .feedback-layout { grid-template-columns:1fr; } }
    .form-card, .list-card { background:white; border-radius:10px; padding:1.5rem; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
    .form-card h3, .list-card h3 { color:#1a237e; margin-bottom:1.25rem; }
    .feedback-form { display:flex; flex-direction:column; gap:1rem; }
    .form-group { display:flex; flex-direction:column; gap:0.4rem; }
    .form-group label { font-size:0.85rem; font-weight:600; color:#333; }
    .form-control { padding:0.65rem 0.9rem; border:1px solid #ddd; border-radius:6px; font-size:0.95rem; outline:none; font-family:inherit; }
    .form-control:focus { border-color:#1a237e; }
    .stars { display:flex; gap:0.25rem; }
    .star { font-size:2rem; cursor:pointer; color:#ddd; transition:color 0.15s; }
    .star.active, .star:hover { color:#ff6f00; }
    .alert { padding:0.7rem 1rem; border-radius:6px; font-size:0.9rem; }
    .alert-error { background:#ffebee; color:#c62828; }
    .alert-success { background:#e8f5e9; color:#2e7d32; }
    .btn-submit { padding:0.75rem; background:#1a237e; color:white; border:none; border-radius:6px; font-size:0.95rem; font-weight:600; cursor:pointer; }
    .btn-submit:disabled { opacity:0.6; cursor:not-allowed; }
    .loading, .empty { color:#888; text-align:center; padding:1rem; }
    .feedback-item { border-bottom:1px solid #f0f0f0; padding:0.75rem 0; }
    .feedback-item:last-child { border-bottom:none; }
    .fb-header { display:flex; justify-content:space-between; align-items:center; }
    .fb-header strong { color:#333; }
    .rating-display { color:#ff6f00; font-size:1rem; }
    .fb-desc { color:#555; font-size:0.9rem; margin:0.35rem 0; }
    .fb-date { font-size:0.75rem; color:#aaa; }
  `]
})
export class FeedbackComponent implements OnInit {
  private feedbackService = inject(FeedbackService);
  private authService = inject(AuthService);

  form = { title: '', description: '', rating: 0 };
  myFeedbacks = signal<FeedbackResponse[]>([]);
  loading = signal(true);
  submitting = signal(false);
  submitError = signal('');
  submitSuccess = signal(false);

  ngOnInit(): void {
    const userId = this.authService.currentUser()?.id;
    if (userId) {
      this.feedbackService.getMyFeedbacks(userId).subscribe({
        next: res => { this.myFeedbacks.set(res.content); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    } else {
      this.loading.set(false);
    }
  }

  submit(): void {
    if (this.form.rating === 0) { this.submitError.set('Please select a rating.'); return; }
    this.submitting.set(true);
    this.submitError.set('');
    this.submitSuccess.set(false);
    this.feedbackService.submitFeedback(this.form).subscribe({
      next: res => {
        this.submitSuccess.set(true);
        this.submitting.set(false);
        this.myFeedbacks.update(prev => [res, ...prev]);
        this.form = { title: '', description: '', rating: 0 };
      },
      error: err => {
        this.submitError.set(err.error?.message || 'Failed to submit feedback.');
        this.submitting.set(false);
      }
    });
  }
}
