import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedbackService } from '../../../core/services/booking.service';
import { TrainService } from '../../../core/services/train.service';
import { FeedbackResponse } from '../../../core/models/booking.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-header">
      <h2>📊 Admin Dashboard</h2>
    </div>

    <div class="stats-grid">
      <div class="stat-card stat-blue">
        <span class="stat-icon">🚂</span>
        <div>
          <div class="stat-value">{{ trainCount() }}</div>
          <div class="stat-label">Total Trains</div>
        </div>
      </div>
      <div class="stat-card stat-orange">
        <span class="stat-icon">💬</span>
        <div>
          <div class="stat-value">{{ feedbackCount() }}</div>
          <div class="stat-label">Total Feedbacks</div>
        </div>
      </div>
      <div class="stat-card stat-green">
        <span class="stat-icon">🎫</span>
        <div>
          <div class="stat-value">—</div>
          <div class="stat-label">Total Bookings</div>
        </div>
      </div>
      <div class="stat-card stat-purple">
        <span class="stat-icon">💰</span>
        <div>
          <div class="stat-value">—</div>
          <div class="stat-label">Revenue</div>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <h3>Quick Actions</h3>
      <div class="actions-grid">
        <a routerLink="/admin/trains" class="action-card">
          <span>🚂</span> Manage Trains
        </a>
        <a routerLink="/admin/stations" class="action-card">
          <span>🏢</span> Manage Stations
        </a>
        <a routerLink="/admin/feedbacks" class="action-card">
          <span>💬</span> View Feedbacks
        </a>
        <a routerLink="/trains/search" class="action-card">
          <span>🔍</span> Search Trains
        </a>
      </div>
    </div>

    <div class="recent-section">
      <h3>Recent Feedbacks</h3>
      @if (recentFeedbacks().length === 0) {
        <p class="empty">No feedbacks yet.</p>
      }
      @for (fb of recentFeedbacks(); track fb.id) {
        <div class="feedback-row">
          <div>
            <strong>{{ fb.title }}</strong>
            <span class="by"> by {{ fb.userName }}</span>
          </div>
          <div class="rating">{{ '★'.repeat(fb.rating) }}{{ '☆'.repeat(5 - fb.rating) }}</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header h2 { color:#1a237e; font-size:1.8rem; margin-bottom:1.5rem; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px,1fr)); gap:1rem; margin-bottom:2rem; }
    .stat-card { display:flex; align-items:center; gap:1rem; background:white; border-radius:10px; padding:1.5rem; box-shadow:0 2px 10px rgba(0,0,0,0.08); border-left:4px solid transparent; }
    .stat-blue { border-left-color:#1a237e; }
    .stat-orange { border-left-color:#ff6f00; }
    .stat-green { border-left-color:#2e7d32; }
    .stat-purple { border-left-color:#6a1b9a; }
    .stat-icon { font-size:2rem; }
    .stat-value { font-size:1.8rem; font-weight:700; color:#333; }
    .stat-label { font-size:0.82rem; color:#888; }
    .quick-actions { background:white; border-radius:10px; padding:1.5rem; box-shadow:0 2px 10px rgba(0,0,0,0.08); margin-bottom:1.5rem; }
    .quick-actions h3, .recent-section h3 { color:#1a237e; margin-bottom:1rem; }
    .actions-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(160px,1fr)); gap:1rem; }
    .action-card { display:flex; align-items:center; gap:0.75rem; background:#f5f5f5; border-radius:8px; padding:1rem 1.25rem; text-decoration:none; color:#333; font-weight:600; transition:background 0.2s; }
    .action-card:hover { background:#e8eaf6; color:#1a237e; }
    .recent-section { background:white; border-radius:10px; padding:1.5rem; box-shadow:0 2px 10px rgba(0,0,0,0.08); }
    .feedback-row { display:flex; justify-content:space-between; align-items:center; padding:0.75rem 0; border-bottom:1px solid #f0f0f0; }
    .feedback-row:last-child { border-bottom:none; }
    .by { color:#888; font-weight:normal; font-size:0.85rem; }
    .rating { color:#ff6f00; }
    .empty { color:#aaa; }
  `]
})
export class DashboardComponent implements OnInit {
  private feedbackService = inject(FeedbackService);
  private trainService = inject(TrainService);

  trainCount = signal<number | string>('...');
  feedbackCount = signal<number | string>('...');
  recentFeedbacks = signal<FeedbackResponse[]>([]);

  ngOnInit(): void {
    this.trainService.getAllTrains().subscribe({
      next: res => this.trainCount.set(Array.isArray(res) ? res.length : ((res as any).totalElements ?? (res as any).content?.length ?? '—')),
      error: () => this.trainCount.set('—')
    });
    this.feedbackService.getAllFeedbacks(0, 5).subscribe({
      next: res => {
        this.feedbackCount.set(res.totalElements);
        this.recentFeedbacks.set(res.content);
      },
      error: () => this.feedbackCount.set('—')
    });
  }
}
