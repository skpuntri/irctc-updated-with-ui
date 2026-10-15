import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
          <!-- From Station Autocomplete -->
          <div class="form-group autocomplete-container">
            <label for="srcInput">From Station</label>
            <div class="input-wrapper">
              <input
                id="srcInput"
                [ngModel]="fromInput()"
                (ngModelChange)="onFromChange($event)"
                (focus)="fromFocused.set(true)"
                (blur)="onBlur('from')"
                name="src"
                placeholder="e.g. NDLS or New Delhi"
                required
                class="form-control"
                autocomplete="off"
              />
              @if (fromInput()) {
                <button type="button" class="btn-clear" (mousedown)="clearFrom()" title="Clear">✕</button>
              }
            </div>

            @if (fromFocused() && fromSuggestions().length > 0) {
              <ul class="dropdown-menu">
                @for (s of fromSuggestions(); track s.id) {
                  <li class="dropdown-item" (mousedown)="selectFrom(s)">
                    <div class="station-main">
                      <span class="station-name">{{ s.name }}</span>
                      <span class="station-badge">{{ s.code }}</span>
                    </div>
                    @if (s.city || s.state) {
                      <div class="station-sub">{{ s.city }}{{ s.city && s.state ? ', ' : '' }}{{ s.state }}</div>
                    }
                  </li>
                }
              </ul>
            }
          </div>

          <!-- Swap Button -->
          <button type="button" class="btn-swap" (click)="swapStations()" title="Swap source and destination">
            ⇄
          </button>

          <!-- To Station Autocomplete -->
          <div class="form-group autocomplete-container">
            <label for="dstInput">To Station</label>
            <div class="input-wrapper">
              <input
                id="dstInput"
                [ngModel]="toInput()"
                (ngModelChange)="onToChange($event)"
                (focus)="toFocused.set(true)"
                (blur)="onBlur('to')"
                name="dst"
                placeholder="e.g. MMCT or Mumbai Central"
                required
                class="form-control"
                autocomplete="off"
              />
              @if (toInput()) {
                <button type="button" class="btn-clear" (mousedown)="clearTo()" title="Clear">✕</button>
              }
            </div>

            @if (toFocused() && toSuggestions().length > 0) {
              <ul class="dropdown-menu">
                @for (s of toSuggestions(); track s.id) {
                  <li class="dropdown-item" (mousedown)="selectTo(s)">
                    <div class="station-main">
                      <span class="station-name">{{ s.name }}</span>
                      <span class="station-badge">{{ s.code }}</span>
                    </div>
                    @if (s.city || s.state) {
                      <div class="station-sub">{{ s.city }}{{ s.city && s.state ? ', ' : '' }}{{ s.state }}</div>
                    }
                  </li>
                }
              </ul>
            }
          </div>

          <!-- Journey Date -->
          <div class="form-group date-group">
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

          <!-- Search Button -->
          <button type="submit" class="btn-search" [disabled]="loading()">
            {{ loading() ? 'Searching...' : '🔍 Search Trains' }}
          </button>
        </div>

        <!-- Quick selection helper pills (Sorted A-Z, zero IDs) -->
        <div class="quick-pills">
          <span class="pills-label">Popular Stations:</span>
          @for (s of popularStations(); track s.id) {
            <button type="button" class="pill-btn" (click)="setQuickStation(s)">
              {{ s.name }} ({{ s.code }})
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
                    @if (coach.availableSeats > 0) {
                      <a
                        [routerLink]="auth.isLoggedIn() ? ['/user/bookings/new'] : ['/auth/login']"
                        [queryParams]="auth.isLoggedIn() ? {
                          trainScheduleId: train.trainScheduleId,
                          trainId: train.trainId,
                          sourceStationId: resolvedSourceId(),
                          destinationStationId: resolvedDestId(),
                          trainName: train.trainName,
                          trainNumber: train.trainNumber,
                          sourceName: sourceDisplay(),
                          destName: destDisplay(),
                          journeyDate: train.scheduleDate || journeyDate,
                          coachType: coach.coachType
                        } : {}"
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
              @if (auth.isLoggedIn()) {
                <a
                  [routerLink]="['/user/bookings/new']"
                  [queryParams]="{
                    trainScheduleId: train.trainScheduleId,
                    trainId: train.trainId,
                    sourceStationId: resolvedSourceId(),
                    destinationStationId: resolvedDestId(),
                    trainName: train.trainName,
                    trainNumber: train.trainNumber,
                    sourceName: sourceDisplay(),
                    destName: destDisplay(),
                    journeyDate: train.scheduleDate || journeyDate
                  }"
                  class="btn-book"
                >
                  🎫 Book Ticket
                </a>
              } @else {
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
    .date-group { max-width: 200px; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: #333; margin-bottom: 0.4rem; }
    .autocomplete-container { position: relative; }
    .input-wrapper { position: relative; display: flex; align-items: center; width: 100%; }
    .form-control {
      width: 100%;
      padding: 0.65rem 2rem 0.65rem 0.9rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-control:focus { border-color: #1a237e; box-shadow: 0 0 0 2px rgba(26,35,126,0.1); }
    .btn-clear {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      font-size: 0.85rem;
      padding: 4px;
      border-radius: 50%;
    }
    .btn-clear:hover { color: #333; background: #f0f0f0; }
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.14);
      border: 1px solid #e0e0e0;
      margin: 0;
      padding: 0.35rem 0;
      list-style: none;
      z-index: 1000;
      max-height: 280px;
      overflow-y: auto;
    }
    .dropdown-item {
      padding: 0.6rem 0.9rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      border-bottom: 1px solid #f7f7f7;
      transition: background 0.15s;
    }
    .dropdown-item:last-child { border-bottom: none; }
    .dropdown-item:hover { background: #f0f4ff; }
    .station-main { display: flex; justify-content: space-between; align-items: center; }
    .station-name { font-weight: 600; color: #1a237e; font-size: 0.92rem; }
    .station-badge {
      background: #e8eaf6;
      color: #1a237e;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .station-sub { font-size: 0.75rem; color: #777; }
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
      transition: background 0.2s, border-color 0.2s;
      flex-shrink: 0;
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
      padding: 0.25rem 0.75rem;
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
  journeyDate = this.today;

  fromInput = signal('');
  toInput = signal('');

  fromFocused = signal(false);
  toFocused = signal(false);

  selectedFromStation = signal<Station | null>(null);
  selectedToStation = signal<Station | null>(null);

  stations = signal<Station[]>(DEFAULT_STATIONS);
  results = signal<AvailableTrainResponse[]>([]);
  loading = signal(false);
  error = signal('');
  searched = signal(false);

  resolvedSourceId = signal<number | undefined>(undefined);
  resolvedDestId = signal<number | undefined>(undefined);
  sourceDisplay = signal<string>('Source');
  destDisplay = signal<string>('Destination');

  // Popular/default stations sorted alphabetically by name (A-Z)
  popularStations = computed(() => {
    return [...this.stations()]
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .slice(0, 6);
  });

  // Filtered dropdown suggestions with smart ranking, sliced to top 8
  fromSuggestions = computed(() => this.filterStations(this.fromInput()));
  toSuggestions = computed(() => this.filterStations(this.toInput()));

  ngOnInit(): void {
    // 1. Try to load cached stations from localStorage
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
        error: () => {}
      });
    }
  }

  // Smart suggestion ranking: Alphabetical & relevance based, top 8 items max
  private filterStations(query: string): Station[] {
    const q = (query || '').trim().toUpperCase();
    const all = this.stations();

    if (!q) {
      return [...all]
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        .slice(0, 8);
    }

    const scored = all.map(s => {
      const code = (s.code || '').toUpperCase();
      const name = (s.name || '').toUpperCase();
      const city = (s.city || '').toUpperCase();
      let score = 0;

      if (code === q) score += 100;
      else if (code.startsWith(q)) score += 60;
      else if (code.includes(q)) score += 20;

      if (name === q) score += 90;
      else if (name.startsWith(q)) score += 50;
      else if (name.includes(q)) score += 25;

      if (city.startsWith(q)) score += 30;
      else if (city.includes(q)) score += 10;

      return { station: s, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || (a.station.name || '').localeCompare(b.station.name || ''))
      .slice(0, 8)
      .map(item => item.station);
  }

  onFromChange(val: string): void {
    this.fromInput.set(val);
    this.selectedFromStation.set(null);
  }

  onToChange(val: string): void {
    this.toInput.set(val);
    this.selectedToStation.set(null);
  }

  selectFrom(s: Station): void {
    this.fromInput.set(`${s.name} (${s.code})`);
    this.selectedFromStation.set(s);
    this.fromFocused.set(false);
  }

  selectTo(s: Station): void {
    this.toInput.set(`${s.name} (${s.code})`);
    this.selectedToStation.set(s);
    this.toFocused.set(false);
  }

  clearFrom(): void {
    this.fromInput.set('');
    this.selectedFromStation.set(null);
  }

  clearTo(): void {
    this.toInput.set('');
    this.selectedToStation.set(null);
  }

  onBlur(type: 'from' | 'to'): void {
    setTimeout(() => {
      if (type === 'from') this.fromFocused.set(false);
      else this.toFocused.set(false);
    }, 180);
  }

  swapStations(): void {
    const tempInput = this.fromInput();
    const tempStation = this.selectedFromStation();

    this.fromInput.set(this.toInput());
    this.selectedFromStation.set(this.selectedToStation());

    this.toInput.set(tempInput);
    this.selectedToStation.set(tempStation);
  }

  setQuickStation(s: Station): void {
    const formatted = `${s.name} (${s.code})`;
    if (!this.fromInput()) {
      this.fromInput.set(formatted);
      this.selectedFromStation.set(s);
    } else if (!this.toInput()) {
      this.toInput.set(formatted);
      this.selectedToStation.set(s);
    } else {
      this.fromInput.set(formatted);
      this.selectedFromStation.set(s);
    }
  }

  private resolveStation(input: string, selected: Station | null): Station | null {
    if (selected) return selected;
    if (!input) return null;
    const trimmed = input.trim().toUpperCase();
    const all = this.stations();

    // 1. Check parenthesized code e.g. "Varanasi (BSB)"
    const match = trimmed.match(/\(([A-Z0-9]+)\)/);
    if (match) {
      const found = all.find(s => s.code?.toUpperCase() === match[1]);
      if (found) return found;
    }

    // 2. Exact code match
    const byCode = all.find(s => s.code?.toUpperCase() === trimmed);
    if (byCode) return byCode;

    // 3. Exact name match
    const byName = all.find(s => s.name?.toUpperCase() === trimmed);
    if (byName) return byName;

    // 4. Prefix or substring match
    const byPrefix = all.find(s =>
      trimmed.startsWith(s.code?.toUpperCase() + ' ') ||
      trimmed.startsWith(s.name?.toUpperCase()) ||
      s.name?.toUpperCase().startsWith(trimmed)
    );
    if (byPrefix) return byPrefix;

    // 5. Numeric ID fallback (if entered directly without seeing it in UI)
    if (/^\d+$/.test(trimmed)) {
      const byId = all.find(s => s.id === Number(trimmed));
      if (byId) return byId;
    }

    return null;
  }

  search(): void {
    this.loading.set(true);
    this.error.set('');
    this.searched.set(true);

    const srcStation = this.resolveStation(this.fromInput(), this.selectedFromStation());
    const dstStation = this.resolveStation(this.toInput(), this.selectedToStation());

    if (!srcStation) {
      this.error.set(
        `Could not find station '${this.fromInput()}'. Please select from the dropdown or type a valid station code or city.`
      );
      this.loading.set(false);
      return;
    }

    if (!dstStation) {
      this.error.set(
        `Could not find station '${this.toInput()}'. Please select from the dropdown or type a valid station code or city.`
      );
      this.loading.set(false);
      return;
    }

    if (srcStation.id === dstStation.id) {
      this.error.set('Source and destination stations cannot be the same.');
      this.loading.set(false);
      return;
    }

    if (!this.journeyDate) {
      this.error.set('Please select a journey date.');
      this.loading.set(false);
      return;
    }

    this.resolvedSourceId.set(srcStation.id);
    this.resolvedDestId.set(dstStation.id);

    this.sourceDisplay.set(`${srcStation.name} (${srcStation.code})`);
    this.destDisplay.set(`${dstStation.name} (${dstStation.code})`);

    const payload: UserTrainSearchRequest = {
      sourceStationId: srcStation.id,
      destinationStationId: dstStation.id,
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
