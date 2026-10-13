import { Component, inject, signal, OnInit } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FeedbackService } from '../../../core/services/booking.service';
import { FeedbackResponse } from '../../../core/models/booking.model';

@Component({
  selector: 'app-feedbacks',
  standalone: true,
  imports: [SlicePipe],
  template: `
    <div class="page-header">
      <h2>💬 All User Feedbacks</h2>
    </div>

    @if (loading()) { <div class="loading">Loading feedbacks...</div> }
    @if (error()) { <div class="alert alert-error">{{ error() }}</div> }

    <div class="stats-bar">
      <span>Total: <strong>{{ total() }}</strong></span>
      <span>Avg Rating: <strong>{{ avgRating() }} ★</strong></span>
    </div>

    <div class="feedbacks-grid">
      @for (fb of feedbacks(); track fb.id) {
        <div class="feedback-card">
          <div class="fb-header">
            <div>
              <strong>{{ fb.title }}</strong>
              <span class="by">by {{ fb.userName }}</span>
            </div>
            <div class="rating">{{ '★'.repeat(fb.rating) }}{{ '☆'.repeat(5 - fb.rating) }}</div>
          </div>
          <p class="fb-desc">{{ fb.description }}</p>
          <div class="fb-footer">
            <span class="fb-date">{{ fb.createdAt | slice:0:10 }}</span>
            @if (fb.isArchived) { <span class="archived-badge">Archived</span> }
          </div>
        </div>
      }
      @if (!loading() && feedbacks().length === 0) {
        <div class="empty-state">No feedbacks yet.</div>
      }
    </div>

    @if (hasMore()) {
      <div class="load-more">
        <button (click)="loadMore()" [disabled]="loading()" class="btn-more">Load More</button>
      </div>
    }
  `,
  styles: [`
    .page-header h2 { color:#1a237e; font-size:1.8rem; margin-bottom:1.5rem; }
    .loading { text-align:center; padding:2rem; color:#555; }
    .alert-error { background:#ffebee; color:#c62828; padding:1rem; border-radius:6px; margin-bottom:1rem; }
    .stats-bar { display:flex; gap:2rem; background:white; border-radius:8px; padding:1rem 1.5rem; margin-bottom:1.5rem; box-shadow:0 2px 8px rgba(0,0,0,0.07); }
    .stats-bar strong { color:#1a237e; }
    .feedbacks-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px,1fr)); gap:1rem; }
    .feedback-card { background:white; border-radius:10px; padding:1.25rem; box-shadow:0 2px 10px rgba(0,0,0,0.08); border-top:3px solid #ff6f00; }
    .fb-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem; }
    .fb-header strong { display:block; color:#333; }
    .by { font-size:0.8rem; color:#888; }
    .rating { color:#ff6f00; font-size:1.1rem; white-space:nowrap; }
    .fb-desc { color:#555; font-size:0.9rem; line-height:1.5; margin:0.5rem 0; }
    .fb-footer { display:flex; justify-content:space-between; align-items:center; }
    .fb-date { font-size:0.75rem; color:#aaa; }
    .archived-badge { background:#f5f5f5; color:#888; font-size:0.75rem; padding:0.2rem 0.5rem; border-radius:4px; }
    .empty-state { grid-column:1/-1; text-align:center; padding:3rem; color:#aaa; }
    .load-more { text-align:center; margin-top:1.5rem; }
    .btn-more { background:#1a237e; color:white; border:none; padding:0.7rem 2rem; border-radius:6px; cursor:pointer; font-weight:600; }
    .btn-more:disabled { opacity:0.6; }
  `]
})
export class FeedbacksComponent implements OnInit {
  private feedbackService = inject(FeedbackService);

  feedbacks = signal<FeedbackResponse[]>([]);
  loading = signal(true);
  error = signal('');
  total = signal(0);
  currentPage = 0;
  hasMore = signal(false);

  get avgRating() {
    return () => {
      const fb = this.feedbacks();
      if (!fb.length) return '—';
      return (fb.reduce((sum, f) => sum + f.rating, 0) / fb.length).toFixed(1);
    };
  }

  ngOnInit(): void { this.loadFeedbacks(); }

  loadFeedbacks(): void {
    this.loading.set(true);
    this.feedbackService.getAllFeedbacks(this.currentPage, 12).subscribe({
      next: res => {
        this.feedbacks.update(prev => [...prev, ...res.content]);
        this.total.set(res.totalElements);
        this.hasMore.set(!res.lastPage);
        this.loading.set(false);
      },
      error: err => { this.error.set(err.error?.message || 'Failed to load feedbacks.'); this.loading.set(false); }
    });
  }

  loadMore(): void {
    this.currentPage++;
    this.loadFeedbacks();
  }
}
