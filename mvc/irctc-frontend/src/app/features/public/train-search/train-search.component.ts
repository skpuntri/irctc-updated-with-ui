import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TrainService } from '../../../core/services/train.service';
import { StationService } from '../../../core/services/station.service';
import { AvailableTrainResponse, UserTrainSearchRequest, Station, CoachType, AvailableCoach } from '../../../core/models/train.model';
import { AuthService } from '../../../core/services/auth.service';

const DEFAULT_STATIONS: Station[] = [
  { id: 1, code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi', state: 'Uttar Pradesh' },
  { id: 2, code: 'SAW', name: 'Suriawan', city: 'Suriawan', state: 'Uttar Pradesh' },
  { id: 3, code: 'LTT', name: 'Lokmanya Tilak Terminus (Mumbai)', city: 'Mumbai', state: 'Maharashtra' },
  { id: 4, code: 'NDLS', name: 'New Delhi', city: 'New Delhi', state: 'Delhi' },
  { id: 5, code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra' },
  { id: 6, code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal' }
];

@Component({
  selector: 'app-train-search',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h2>🔍 Search Trains</h2>
      <p class="subtitle">Real-time seat availability & train schedules — no login required to search</p>
    </div>

    <div class="search-card">
      <form (ngSubmit)="search()" class="search-form">
        <div class="form-row">
          <div class="form-group">
            <label for="srcInput">From Station</label>
            <input
              id="srcInput"
              [(ngModel)]="fromInput"
              name="src"
              list="stationsList"
              placeholder="e.g. NDLS or Station ID"
              required
              class="form-control"
              autocomplete="off"
            />
          </div>

          <button type="button" class="btn-swap" (click)="swapStations()" title="Swap source and destination">
            ⇄
          </button>

          <div class="form-group">
            <label for="dstInput">To Station</label>
            <input
              id="dstInput"
              [(ngModel)]="toInput"
              name="dst"
              list="stationsList"
              placeholder="e.g. MMCT or Station ID"
              required
              class="form-control"
              autocomplete="off"
            />
          </div>

          <div class="form-group">
            <label for="jDate">Journey Date</label>
            <input
              id="jDate"
              [(ngModel)]="journeyDate"
              name="date"
              type="date"
              required
              class="form-control"
              [min]="today"
            />
          </div>

          <button type="submit" class="btn-search" [disabled]="loading()">
            {{ loading() ? 'Searching...' : '🔍 Search Trains' }}
          </button>
        </div>

        <datalist id="stationsList">
          @for (s of stations(); track s.id) {
            <option [value]="s.code + ' - ' + s.name + ' (ID: ' + s.id + ')'"></option>
          }
        </datalist>

        <!-- Quick station helper pills -->
        <div class="quick-pills">
          <span class="pills-label">Quick select:</span>
          @for (s of stations().slice(0, 6); track s.id) {
            <button type="button" class="pill-btn" (click)="setQuickStation(s)">
              {{ s.code }} ({{ s.name }})
            </button>
          }
        </div>
      </form>
    </div>

    @if (error()) {
      <div class="alert alert-error">{{ error() }}</div>
    }

    @if (results().length > 0) {
      <div class="results-header">
        <h3>{{ results().length }} Train(s) Found on {{ journeyDate }}</h3>
        <p class="route-summary">
          📍 <strong>{{ sourceDisplay() }}</strong> → 📍 <strong>{{ destDisplay() }}</strong>
        </p>
      </div>

      <div class="results-list">
        @for (train of results(); track train.trainId) {
          <div class="train-card">
            <div class="train-header">
              <div>
                <div class="train-title-row">
                  <h3 class="train-name">{{ train.trainName }}</h3>
                  <span class="train-number">#{{ train.trainNumber }}</span>
                </div>
                <div class="schedule-date">Run Date: {{ train.scheduleDate || journeyDate }}</div>
              </div>
              <div class="journey-info">
                <div class="time-block">
                  <span class="time-label">Dep</span>
                  <span class="time">{{ train.departureTime || '--:--' }}</span>
                </div>
                <span class="arrow">→</span>
                <div class="time-block">
                  <span class="time-label">Arr</span>
                  <span class="time">{{ train.arrivalTime || '--:--' }}</span>
                </div>
              </div>
            </div>

            <div class="station-row">
              <span>📍 {{ sourceDisplay() }}</span>
              <span class="route-dash">────────</span>
              <span>📍 {{ destDisplay() }}</span>
            </div>

            <div class="coaches-container">
              <div class="coaches-title">Available Coaches & Fares:</div>
              <div class="coaches-row">
                @for (coach of train.availableCoaches; track coach.coachType) {
                  <div class="coach-badge" [class]="'coach-' + coach.coachType.toLowerCase()">
                    <span class="coach-type">{{ coach.coachType }}</span>
                    <span class="coach-seats" [class.no-seats]="coach.availableSeats <= 0">
                      {{ coach.availableSeats > 0 ? (coach.availableSeats + ' Available') : 'WL / Full' }}
                    </span>
                    <span class="coach-price">₹{{ coach.price }}</span>
                    @if (auth.isNormalUser() && coach.availableSeats > 0) {
                      <a
                        [routerLink]="['/user/bookings/new']"
                        [queryParams]="{
                          trainScheduleId: train.trainScheduleId,
                          sourceStationId: resolvedSourceId(),
                          destinationStationId: resolvedDestId(),
                          coachType: coach.coachType
                        }"
                        class="btn-book-sm"
                      >
                        Book
                      </a>
                    }
                  </div>
                }
                @if (!train.availableCoaches || train.availableCoaches.length === 0) {
                  <div class="no-coaches-msg">No seats currently allocated for this schedule.</div>
                }
              </div>
            </div>

            <div class="train-actions">
              @if (auth.isNormalUser()) {
                <a
                  [routerLink]="['/user/bookings/new']"
                  [queryParams]="{
                    trainScheduleId: train.trainScheduleId,
                    sourceStationId: resolvedSourceId(),
                    destinationStationId: resolvedDestId()
                  }"
                  class="btn-book"
                >
                  🎫 Book Ticket
                </a>
              } @else if (!auth.isLoggedIn()) {
                <a routerLink="/auth/login" class="btn-login-to-book">
                  🔐 Login to Book →
                </a>
              }
            </div>
          </div>
        }
      </div>
    }

    @if (searched() && results().length === 0 && !loading() && !error()) {
      <div class="empty-state">
        <p class="empty-icon">🚆</p>
        <h4>No trains found for this route and date</h4>
        <p class="empty-hint">
          Make sure trains are configured on this route with a schedule matching {{ journeyDate }}.
        </p>
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .page-header h2 { font-size: 1.8rem; color: #1a237e; font-weight: 700; margin: 0; }
    .subtitle { color: #555; margin-top: 0.35rem; font-size: 0.95rem; }
    .search-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 3px 15px rgba(0,0,0,0.08);
      margin-bottom: 1.5rem;
    }
    .form-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    .form-group { display: flex; flex-direction: column; flex: 1; min-width: 170px; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: #333; margin-bottom: 0.4rem; }
    .form-control {
      padding: 0.65rem 0.9rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-control:focus { border-color: #1a237e; box-shadow: 0 0 0 2px rgba(26,35,126,0.1); }
    .btn-swap {
      height: 40px;
      width: 40px;
      border-radius: 50%;
      border: 1px solid #ccc;
      background: #f8f9fa;
      cursor: pointer;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2px;
      transition: background 0.2s;
    }
    .btn-swap:hover { background: #e8eaf6; color: #1a237e; border-color: #1a237e; }
    .btn-search {
      padding: 0.68rem 1.6rem;
      background: #1a237e;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.2s;
    }
    .btn-search:hover:not(:disabled) { background: #283593; }
    .btn-search:disabled { opacity: 0.6; cursor: not-allowed; }
    .quick-pills {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-top: 1rem;
      flex-wrap: wrap;
    }
    .pills-label { font-size: 0.8rem; color: #777; font-weight: 500; }
    .pill-btn {
      background: #f0f2f5;
      border: 1px solid #e0e0e0;
      border-radius: 14px;
      padding: 0.2rem 0.65rem;
      font-size: 0.78rem;
      color: #333;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pill-btn:hover { background: #e8eaf6; color: #1a237e; border-color: #c5cae9; }
    .alert { padding: 1rem; border-radius: 6px; margin-bottom: 1rem; }
    .alert-error { background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; }
    .results-header { margin-bottom: 1rem; }
    .results-header h3 { color: #1a237e; margin: 0; font-size: 1.3rem; }
    .route-summary { color: #555; margin: 0.3rem 0 0 0; font-size: 0.95rem; }
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
      flex-wrap: wrap;
      gap: 1rem;
    }
    .train-title-row { display: flex; align-items: center; gap: 0.75rem; }
    .train-name { margin: 0; color: #1a237e; font-size: 1.25rem; }
    .train-number {
      background: #e8eaf6;
      color: #1a237e;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.82rem;
      font-weight: 700;
    }
    .schedule-date { font-size: 0.8rem; color: #777; margin-top: 0.25rem; }
    .journey-info { display: flex; align-items: center; gap: 1rem; background: #fafafa; padding: 0.4rem 0.8rem; border-radius: 6px; }
    .time-block { display: flex; flex-direction: column; align-items: center; }
    .time-label { font-size: 0.7rem; color: #888; text-transform: uppercase; }
    .time { font-size: 1.05rem; font-weight: 700; color: #222; }
    .arrow { color: #888; font-size: 1.1rem; }
    .station-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #444;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px dashed #eee;
    }
    .route-dash { color: #ccc; letter-spacing: 2px; }
    .coaches-container { margin-bottom: 1rem; }
    .coaches-title { font-size: 0.82rem; font-weight: 600; color: #666; margin-bottom: 0.5rem; }
    .coaches-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .coach-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.6rem 1rem;
      border-radius: 8px;
      min-width: 95px;
      gap: 0.2rem;
    }
    .coach-ac { background: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb; }
    .coach-sleeper { background: #f3e5f5; color: #6a1b9a; border: 1px solid #e1bee7; }
    .coach-general { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
    .coach-type { font-weight: 700; font-size: 0.85rem; }
    .coach-seats { font-size: 0.8rem; font-weight: 600; }
    .coach-seats.no-seats { color: #d32f2f; }
    .coach-price { font-weight: 700; font-size: 0.95rem; }
    .btn-book-sm {
      margin-top: 0.3rem;
      background: #ff6f00;
      color: white;
      text-decoration: none;
      padding: 0.2rem 0.6rem;
      font-size: 0.75rem;
      border-radius: 4px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .btn-book-sm:hover { background: #e65100; }
    .no-coaches-msg { font-size: 0.85rem; color: #888; font-style: italic; }
    .train-actions { display: flex; justify-content: flex-end; align-items: center; }
    .btn-book {
      background: #ff6f00;
      color: white;
      padding: 0.6rem 1.6rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      transition: background 0.2s;
    }
    .btn-book:hover { background: #e65100; }
    .btn-login-to-book {
      color: #1a237e;
      font-weight: 600;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border: 1px solid #1a237e;
      border-radius: 6px;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    .btn-login-to-book:hover { background: #1a237e; color: white; }
    .empty-state {
      text-align: center;
      padding: 3.5rem 1.5rem;
      color: #666;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.06);
    }
    .empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .empty-state h4 { color: #333; margin: 0 0 0.5rem 0; font-size: 1.2rem; }
    .empty-hint { color: #888; font-size: 0.9rem; margin: 0; }
  `]
})
export class TrainSearchComponent implements OnInit {
  private trainService = inject(TrainService);
  private stationService = inject(StationService);
  auth = inject(AuthService);

  today = new Date().toISOString().split('T')[0];
  fromInput = '';
  toInput = '';
  journeyDate = this.today;

  stations = signal<Station[]>(DEFAULT_STATIONS);
  results = signal<AvailableTrainResponse[]>([]);
  loading = signal(false);
  error = signal('');
  searched = signal(false);

  resolvedSourceId = signal<number | undefined>(undefined);
  resolvedDestId = signal<number | undefined>(undefined);
  sourceDisplay = signal<string>('Source');
  destDisplay = signal<string>('Destination');

  ngOnInit(): void {
    // 1. Try to load previously cached stations
    try {
      const cached = localStorage.getItem('irctc_stations');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.stations.set(parsed);
        }
      }
    } catch {
      // ignore
    }

    // 2. If logged in, fetch latest stations from backend
    if (this.auth.isLoggedIn()) {
      this.stationService.getStations(0, 500).subscribe({
        next: res => {
          const fetched = res.content ?? [];
          if (fetched.length > 0) {
            this.stations.set(fetched);
            try {
              localStorage.setItem('irctc_stations', JSON.stringify(fetched));
            } catch {
              // ignore
            }
          }
        },
        error: () => {
          // If unauthorized or error, keep DEFAULT_STATIONS / cached
        }
      });
    }
  }

  swapStations(): void {
    const temp = this.fromInput;
    this.fromInput = this.toInput;
    this.toInput = temp;
  }

  setQuickStation(s: Station): void {
    if (!this.fromInput) {
      this.fromInput = `${s.code} - ${s.name} (ID: ${s.id})`;
    } else if (!this.toInput) {
      this.toInput = `${s.code} - ${s.name} (ID: ${s.id})`;
    } else {
      this.fromInput = `${s.code} - ${s.name} (ID: ${s.id})`;
    }
  }

  resolveStationId(input: string): number | null {
    if (!input) return null;
    const trimmed = input.trim();

    // 1. Check parenthesized ID pattern like "(ID: 1)" or "ID: 1"
    const match = trimmed.match(/\(ID:\s*(\d+)\)/i) || trimmed.match(/ID:\s*(\d+)/i);
    if (match) return Number(match[1]);

    // 2. Check pure numeric ID e.g. "1"
    if (/^\d+$/.test(trimmed)) return Number(trimmed);

    // 3. Match against known station code or name
    const upper = trimmed.toUpperCase();
    const all = this.stations();

    // Exact code match
    const byCode = all.find(s => s.code?.toUpperCase() === upper);
    if (byCode) return byCode.id;

    // Exact name match
    const byName = all.find(s => s.name?.toUpperCase() === upper);
    if (byName) return byName.id;

    // Prefix match (e.g. user typed "NDLS - New Delhi")
    const byPrefix = all.find(s =>
      upper.startsWith(s.code?.toUpperCase() + ' -') ||
      upper.startsWith(s.code?.toUpperCase() + ' ') ||
      upper.includes(s.name?.toUpperCase())
    );
    if (byPrefix) return byPrefix.id;

    return null;
  }

  search(): void {
    this.loading.set(true);
    this.error.set('');
    this.searched.set(true);

    const srcId = this.resolveStationId(this.fromInput);
    const dstId = this.resolveStationId(this.toInput);

    if (!srcId) {
      this.error.set(
        `Could not identify source station '${this.fromInput}'. Please select a station from the list or enter a numeric Station ID.`
      );
      this.loading.set(false);
      return;
    }

    if (!dstId) {
      this.error.set(
        `Could not identify destination station '${this.toInput}'. Please select a station from the list or enter a numeric Station ID.`
      );
      this.loading.set(false);
      return;
    }

    if (srcId === dstId) {
      this.error.set('Source and destination stations cannot be the same.');
      this.loading.set(false);
      return;
    }

    if (!this.journeyDate) {
      this.error.set('Please select a journey date.');
      this.loading.set(false);
      return;
    }

    this.resolvedSourceId.set(srcId);
    this.resolvedDestId.set(dstId);

    const srcStation = this.stations().find(s => s.id === srcId);
    const dstStation = this.stations().find(s => s.id === dstId);
    this.sourceDisplay.set(srcStation ? `${srcStation.name} (${srcStation.code})` : `Station #${srcId}`);
    this.destDisplay.set(dstStation ? `${dstStation.name} (${dstStation.code})` : `Station #${dstId}`);

    // Send numeric sourceStationId & destinationStationId as expected by Spring Boot backend
    const payload: UserTrainSearchRequest = {
      sourceStationId: srcId,
      destinationStationId: dstId,
      journeyDate: this.journeyDate
    };

    this.trainService.searchTrains(payload).subscribe({
      next: res => {
        const mapped = (res || []).map(train => {
          let coaches: AvailableCoach[] = [];
          if (train.seatsAvailable) {
            const seatMap = train.seatsAvailable as Record<string, number>;
            const priceMap = (train.priceByCoach || {}) as Record<string, number>;
            coaches = Object.keys(seatMap).map(k => ({
              coachType: k as CoachType,
              availableSeats: seatMap[k] ?? 0,
              price: priceMap[k] ?? 0
            }));
          }
          return {
            ...train,
            availableCoaches: coaches
          };
        });
        this.results.set(mapped);
        this.loading.set(false);
      },
      error: err => {
        const msg = err.error?.message || (typeof err.error === 'string' ? err.error : 'Train search failed. Please try again.');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }
}
