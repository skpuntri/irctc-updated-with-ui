import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TrainService } from '../../../core/services/train.service';
import { AvailableTrainResponse, UserTrainSearchRequest } from '../../../core/models/train.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-train-search',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h2>🔍 Search Trains</h2>
      <p class="subtitle">Search is available to everyone — no login required</p>
    </div>

    <div class="search-card">
      <form (ngSubmit)="search()" class="search-form">
        <div class="form-row">
          <div class="form-group">
            <label>From Station Code</label>
            <input [(ngModel)]="req.sourceStationCode" name="src" placeholder="e.g. NDLS" required class="form-control" />
          </div>
          <div class="form-group">
            <label>To Station Code</label>
            <input [(ngModel)]="req.destinationStationCode" name="dst" placeholder="e.g. MMCT" required class="form-control" />
          </div>
          <div class="form-group">
            <label>Journey Date</label>
            <input [(ngModel)]="req.journeyDate" name="date" type="date" required class="form-control" [min]="today" />
          </div>
          <button type="submit" class="btn-search" [disabled]="loading()">
            {{ loading() ? 'Searching...' : '🔍 Search' }}
          </button>
        </div>
      </form>
    </div>

    @if (error()) {
      <div class="alert alert-error">{{ error() }}</div>
    }

    @if (results().length > 0) {
      <div class="results-header">
        <h3>{{ results().length }} train(s) found</h3>
      </div>
      <div class="results-list">
        @for (train of results(); track train.trainId) {
          <div class="train-card">
            <div class="train-header">
              <div>
                <h3>{{ train.trainName }}</h3>
                <span class="train-number">{{ train.trainNumber }}</span>
              </div>
              <div class="journey-info">
                <span class="time">{{ train.departureTime || '--:--' }}</span>
                <span class="arrow">→</span>
                <span class="time">{{ train.arrivalTime || '--:--' }}</span>
              </div>
            </div>
            <div class="station-row">
              <span>📍 {{ train.sourceStation?.name }} ({{ train.sourceStation?.code }})</span>
              <span>→</span>
              <span>📍 {{ train.destinationStation?.name }} ({{ train.destinationStation?.code }})</span>
            </div>
            <div class="coaches-row">
              @for (coach of train.availableCoaches; track coach.coachType) {
                <div class="coach-badge" [class]="'coach-' + coach.coachType.toLowerCase()">
                  <span class="coach-type">{{ coach.coachType }}</span>
                  <span class="coach-seats">{{ coach.availableSeats }} seats</span>
                  <span class="coach-price">₹{{ coach.price }}</span>
                </div>
              }
            </div>
            @if (auth.isNormalUser()) {
              <div class="book-action">
                <a [routerLink]="['/user/bookings/new']"
                   [queryParams]="{ trainId: train.trainId, date: req.journeyDate }"
                   class="btn-book">
                  🎫 Book Now
                </a>
              </div>
            } @else if (!auth.isLoggedIn()) {
              <div class="book-action">
                <a routerLink="/auth/login" class="btn-login-to-book">Login to Book →</a>
              </div>
            }
          </div>
        }
      </div>
    }

    @if (searched() && results().length === 0 && !loading() && !error()) {
      <div class="empty-state">
        <p>😕 No trains found for this route and date. Try different stations or date.</p>
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .page-header h2 { font-size: 1.8rem; color: #1a237e; }
    .subtitle { color: #555; margin-top: 0.25rem; }
    .search-card {
      background: white;
      border-radius: 10px;
      padding: 1.5rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      margin-bottom: 1.5rem;
    }
    .form-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    .form-group { display: flex; flex-direction: column; flex: 1; min-width: 160px; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: #333; margin-bottom: 0.4rem; }
    .form-control {
      padding: 0.6rem 0.9rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.95rem;
      outline: none;
    }
    .form-control:focus { border-color: #1a237e; }
    .btn-search {
      padding: 0.65rem 1.5rem;
      background: #1a237e;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .btn-search:disabled { opacity: 0.6; cursor: not-allowed; }
    .alert { padding: 1rem; border-radius: 6px; margin-bottom: 1rem; }
    .alert-error { background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; }
    .results-header h3 { color: #1a237e; margin-bottom: 1rem; }
    .results-list { display: flex; flex-direction: column; gap: 1rem; }
    .train-card {
      background: white;
      border-radius: 10px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      border-left: 4px solid #1a237e;
    }
    .train-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    .train-header h3 { margin: 0; color: #1a237e; }
    .train-number {
      background: #e8eaf6;
      color: #1a237e;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .journey-info { display: flex; align-items: center; gap: 0.5rem; }
    .time { font-size: 1.1rem; font-weight: 700; color: #333; }
    .arrow { color: #aaa; }
    .station-row {
      display: flex;
      gap: 1rem;
      color: #555;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    .coaches-row { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .coach-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.6rem 1rem;
      border-radius: 8px;
      min-width: 80px;
    }
    .coach-ac { background: #e3f2fd; color: #1565c0; }
    .coach-sleeper { background: #f3e5f5; color: #6a1b9a; }
    .coach-general { background: #e8f5e9; color: #2e7d32; }
    .coach-type { font-weight: 700; font-size: 0.85rem; }
    .coach-seats { font-size: 0.75rem; }
    .coach-price { font-weight: 600; font-size: 0.9rem; }
    .book-action { display: flex; justify-content: flex-end; }
    .btn-book {
      background: #ff6f00;
      color: white;
      padding: 0.6rem 1.5rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
    }
    .btn-login-to-book {
      color: #1a237e;
      font-weight: 600;
      text-decoration: none;
    }
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #777;
      background: white;
      border-radius: 10px;
    }
  `]
})
export class TrainSearchComponent {
  private trainService = inject(TrainService);
  auth = inject(AuthService);

  today = new Date().toISOString().split('T')[0];
  req: UserTrainSearchRequest = {
    sourceStationCode: '',
    destinationStationCode: '',
    journeyDate: this.today
  };

  results = signal<AvailableTrainResponse[]>([]);
  loading = signal(false);
  error = signal('');
  searched = signal(false);

  search(): void {
    this.loading.set(true);
    this.error.set('');
    this.searched.set(true);
    this.trainService.searchTrains(this.req).subscribe({
      next: res => {
        const mapped = (res || []).map(train => {
          let coaches = train.availableCoaches || [];
          if (!coaches.length && train.seatsAvailable) {
            const seats = train.seatsAvailable as Record<string, number>;
            const prices = (train.priceByCoach || {}) as Record<string, number>;
            coaches = Object.keys(seats).map(k => ({
              coachType: k as any,
              availableSeats: seats[k] ?? 0,
              price: prices[k] ?? 0
            }));
          }
          return { ...train, availableCoaches: coaches };
        });
        this.results.set(mapped);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message || 'Search failed. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
