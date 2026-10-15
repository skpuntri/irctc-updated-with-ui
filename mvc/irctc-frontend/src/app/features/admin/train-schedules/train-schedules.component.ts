import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TrainService } from '../../../core/services/train.service';
import { Train, TrainSchedule, TrainSeat, CoachType } from '../../../core/models/train.model';

@Component({
  selector: 'app-train-schedules',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>📅 Run Schedules for {{ train()?.name || 'Train' }} ({{ train()?.number }})</h2>
        <a routerLink="/admin/trains" class="back-link">← Back to Trains</a>
      </div>
      <button (click)="openAdd()" class="btn-primary">+ Add Schedule Date</button>
    </div>

    @if (loading()) { <div class="loading">Loading schedules...</div> }
    @if (error()) { <div class="alert alert-error">{{ error() }}</div> }

    <!-- 1. SCHEDULE MODAL (ADD / EDIT) -->
    @if (showForm()) {
      <div class="modal-overlay" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editing() ? 'Edit Schedule' : 'Add Run Date' }}</h3>
          <form (ngSubmit)="save()">
            <div class="form-grid">
              <div class="form-group">
                <label>Run Date</label>
                <input [(ngModel)]="form.runDate" name="runDate" type="date" required class="form-control" [min]="today" />
              </div>
              <div class="form-group">
                <label>Available Seats (Overall)</label>
                <input [(ngModel)]="form.availableSeats" name="availableSeats" type="number" min="0" placeholder="e.g. 100" required class="form-control" />
              </div>
            </div>
            @if (formError()) { <div class="alert alert-error">{{ formError() }}</div> }
            <div class="modal-actions">
              <button type="button" (click)="closeForm()" class="btn-cancel">Cancel</button>
              <button type="submit" class="btn-save" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- 2. SCHEDULE TABLE -->
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Schedule ID</th>
            <th>Run Date</th>
            <th>Overall Seats</th>
            <th>Coaches & Seats</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (s of sortedSchedules(); track s.id) {
            <tr>
              <td><span class="id-badge">#{{ s.id }}</span></td>
              <td><strong>📅 {{ s.runDate }}</strong></td>
              <td><span class="seats-badge">{{ s.availableSeats }} seats</span></td>
              <td>
                <button (click)="openSeats(s)" class="btn-seats">
                  💺 Manage Coaches & Seats
                </button>
              </td>
              <td class="actions">
                <button (click)="openEdit(s)" class="btn-edit">Edit</button>
                <button (click)="deleteSchedule(s.id)" class="btn-delete">Delete</button>
              </td>
            </tr>
          }
          @if (!loading() && schedules().length === 0) {
            <tr><td colspan="5" class="empty-row">No run schedules added for this train yet. Click "+ Add Schedule Date" above.</td></tr>
          }
        </tbody>
      </table>
    </div>

    <!-- 3. COACHES & SEATS MODAL -->
    @if (showSeatsModal()) {
      <div class="modal-overlay" (click)="closeSeatsModal()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header-row">
            <div>
              <h3>💺 Coach & Seat Allocations</h3>
              <p class="modal-sub">
                Train: <strong>{{ train()?.name }} ({{ train()?.number }})</strong> | Date: <strong>📅 {{ selectedScheduleForSeats()?.runDate }}</strong> (Schedule #{{ selectedScheduleForSeats()?.id }})
              </p>
              @if (!seatsLoading() && seats().length > 0) {
                <div class="coach-summary-badge">
                  Total Coach Seats: <strong>{{ totalCoachSeats() }} seats</strong> across {{ seats().length }} coach(es)
                </div>
              }
            </div>
            <button type="button" (click)="openAddSeat()" class="btn-primary btn-sm">+ Add Coach Tier</button>
          </div>

          @if (seatsLoading()) {
            <div class="loading">Loading coach seats...</div>
          }

          @if (seatsError()) {
            <div class="alert alert-error">{{ seatsError() }}</div>
          }

          @if (!seatsLoading()) {
            <div class="seats-table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Coach Class</th>
                    <th>Total Seats</th>
                    <th>Available</th>
                    <th>Price (₹)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (st of seats(); track st.id) {
                    <tr>
                      <td><span class="order-badge">#{{ st.trainSeatOrder }}</span></td>
                      <td>
                        <span class="coach-badge" [class]="'coach-' + st.coachType.toLowerCase()">
                          {{ st.coachType }}
                        </span>
                      </td>
                      <td><strong>{{ st.totalSeats }}</strong></td>
                      <td><span class="seats-avail">{{ st.availableSeats }}</span></td>
                      <td><strong class="price">₹{{ st.price }}</strong></td>
                      <td class="actions">
                        <button (click)="openEditSeat(st)" class="btn-edit btn-sm">Edit</button>
                        <button (click)="deleteSeat(st.id)" class="btn-delete btn-sm">Delete</button>
                      </td>
                    </tr>
                  }
                  @if (seats().length === 0) {
                    <tr>
                      <td colspan="6" class="empty-row">
                        No coach classes configured for this schedule yet.<br />
                        Click <strong>"+ Add Coach Tier"</strong> above to add AC, Sleeper, or General coaches.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <div class="modal-actions">
            <button type="button" (click)="closeSeatsModal()" class="btn-cancel">Close</button>
          </div>
        </div>
      </div>
    }

    <!-- 4. ADD / EDIT COACH FORM SUB-MODAL -->
    @if (showSeatForm()) {
      <div class="modal-overlay sub-modal" (click)="closeSeatForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingSeat() ? 'Edit Coach Tier' : 'Add Coach Tier' }}</h3>
          <form (ngSubmit)="saveSeat()">
            <div class="form-grid">
              <div class="form-group">
                <label>Coach Class</label>
                <select [(ngModel)]="seatForm.coachType" name="cType" required class="form-control">
                  <option value="AC">AC (Air Conditioned)</option>
                  <option value="SLEEPER">SLEEPER (Sleeper Class)</option>
                  <option value="GENERAL">GENERAL (Second Sitting)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Coach Order (#)</label>
                <input [(ngModel)]="seatForm.trainSeatOrder" name="cOrder" type="number" min="1" placeholder="1" required class="form-control" />
              </div>

              <div class="form-group">
                <label>Total Seats</label>
                <input [(ngModel)]="seatForm.totalSeats" name="cTotal" type="number" min="1" placeholder="e.g. 60" required class="form-control" />
              </div>

              <div class="form-group">
                <label>Available Seats</label>
                <input [(ngModel)]="seatForm.availableSeats" name="cAvail" type="number" min="0" placeholder="e.g. 60" required class="form-control" />
              </div>

              <div class="form-group span-2">
                <label>Fare Price per Seat (₹)</label>
                <input [(ngModel)]="seatForm.price" name="cPrice" type="number" min="0" step="0.5" placeholder="e.g. 1200" required class="form-control" />
              </div>
            </div>

            @if (seatFormError()) {
              <div class="alert alert-error">{{ seatFormError() }}</div>
            }

            <div class="modal-actions">
              <button type="button" (click)="closeSeatForm()" class="btn-cancel">Cancel</button>
              <button type="submit" class="btn-save" [disabled]="savingSeat()">
                {{ savingSeat() ? 'Saving Coach...' : 'Save Coach Tier' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .page-header h2 { color:#1a237e; font-size:1.6rem; margin-bottom:0.25rem; }
    .back-link { color:#ff6f00; text-decoration:none; font-weight:600; font-size:0.9rem; }
    .btn-primary { background:#1a237e; color:white; padding:0.6rem 1.25rem; border:none; border-radius:6px; cursor:pointer; font-weight:600; }
    .btn-sm { padding:0.35rem 0.85rem !important; font-size:0.82rem !important; }
    .loading { text-align:center; padding:2rem; color:#555; }
    .alert-error { background:#ffebee; color:#c62828; padding:0.75rem 1rem; border-radius:6px; margin-bottom:1rem; }
    .table-card { background:white; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.08); overflow:auto; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { background:#1a237e; color:white; padding:0.75rem 1rem; text-align:left; font-size:0.85rem; }
    .data-table td { padding:0.75rem 1rem; border-bottom:1px solid #f0f0f0; font-size:0.9rem; }
    .data-table tr:hover td { background:#f8f9ff; }
    .id-badge { background:#e8eaf6; color:#1a237e; padding:0.2rem 0.5rem; border-radius:4px; font-weight:700; font-size:0.85rem; }
    .seats-badge { background:#e8f5e9; color:#2e7d32; padding:0.2rem 0.6rem; border-radius:4px; font-weight:700; font-size:0.85rem; }
    .actions { display:flex; gap:0.4rem; align-items:center; }
    .btn-seats {
      background: #e3f2fd;
      color: #1565c0;
      border: 1px solid #90caf9;
      padding: 0.35rem 0.75rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.82rem;
      transition: background 0.15s;
    }
    .btn-seats:hover { background: #bbdefb; }
    .btn-edit { background:#fff8e1; color:#f57f17; border:none; padding:0.35rem 0.75rem; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.82rem; }
    .btn-delete { background:#ffebee; color:#c62828; border:none; padding:0.35rem 0.75rem; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.82rem; }
    .empty-row { text-align:center; color:#888; padding:2rem; }

    /* Modals */
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:999; }
    .sub-modal { z-index: 1001 !important; }
    .modal { background:white; border-radius:12px; padding:2rem; width:100%; max-width:480px; box-shadow:0 8px 30px rgba(0,0,0,0.2); }
    .modal-lg { max-width: 720px !important; }
    .modal-header-row { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; border-bottom:1px solid #eee; padding-bottom:0.75rem; }
    .modal-header-row h3 { color:#1a237e; margin:0; }
    .modal-sub { color:#666; font-size:0.85rem; margin:0.25rem 0 0 0; }
    .coach-summary-badge { display:inline-block; margin-top:0.35rem; background:#e8f5e9; color:#2e7d32; padding:0.25rem 0.65rem; border-radius:12px; font-size:0.8rem; font-weight:600; border:1px solid #c8e6c9; }
    .seats-table-wrap { max-height:360px; overflow-y:auto; margin-bottom:1rem; border:1px solid #eee; border-radius:8px; }
    .order-badge { background:#eee; padding:0.15rem 0.4rem; border-radius:4px; font-weight:700; font-size:0.8rem; }
    .coach-badge { padding:0.2rem 0.55rem; border-radius:4px; font-weight:700; font-size:0.8rem; }
    .coach-ac { background:#e3f2fd; color:#1565c0; border:1px solid #bbdefb; }
    .coach-sleeper { background:#f3e5f5; color:#6a1b9a; border:1px solid #e1bee7; }
    .coach-general { background:#e8f5e9; color:#2e7d32; border:1px solid #c8e6c9; }
    .seats-avail { color:#2e7d32; font-weight:700; }
    .price { color:#1a237e; font-size:0.95rem; }

    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .span-2 { grid-column:span 2; }
    .form-group { display:flex; flex-direction:column; gap:0.4rem; }
    .form-group label { font-size:0.82rem; font-weight:600; color:#555; }
    .form-control { padding:0.65rem 0.9rem; border:1px solid #ddd; border-radius:6px; font-size:0.9rem; outline:none; }
    .form-control:focus { border-color:#1a237e; }
    .modal-actions { display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.25rem; }
    .btn-cancel { background:#f5f5f5; color:#333; border:none; padding:0.6rem 1.25rem; border-radius:6px; cursor:pointer; }
    .btn-save { background:#1a237e; color:white; border:none; padding:0.6rem 1.5rem; border-radius:6px; cursor:pointer; font-weight:600; }
    .btn-save:disabled { opacity:0.6; }
  `]
})
export class TrainSchedulesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private trainService = inject(TrainService);

  today = new Date().toISOString().split('T')[0];
  trainId = 0;
  train = signal<Train | null>(null);
  schedules = signal<TrainSchedule[]>([]);
  loading = signal(true);
  error = signal('');
  showForm = signal(false);
  editing = signal<TrainSchedule | null>(null);
  saving = signal(false);
  formError = signal('');
  form: any = {};

  // Coach & Seat management signals
  showSeatsModal = signal(false);
  selectedScheduleForSeats = signal<TrainSchedule | null>(null);
  seats = signal<TrainSeat[]>([]);
  seatsLoading = signal(false);
  seatsError = signal('');

  showSeatForm = signal(false);
  editingSeat = signal<TrainSeat | null>(null);
  savingSeat = signal(false);
  seatFormError = signal('');
  seatForm: any = {};

  totalCoachSeats = computed(() => {
    return this.seats().reduce((sum, s) => sum + (Number(s.availableSeats) || 0), 0);
  });

  sortedSchedules = computed(() =>
    [...this.schedules()].sort((a, b) => (a.runDate || '').localeCompare(b.runDate || ''))
  );

  ngOnInit(): void {
    const getTrainId = () => {
      return Number(
        this.route.snapshot.params['trainId'] ||
        this.route.snapshot.paramMap.get('trainId') ||
        this.route.parent?.snapshot.params['trainId'] ||
        0
      );
    };

    const initialId = getTrainId();
    if (initialId) {
      this.trainId = initialId;
      this.loadTrain();
      this.loadSchedules();
    }

    this.route.params.subscribe(params => {
      const id = Number(params['trainId'] || this.route.parent?.snapshot.params['trainId']);
      if (id && id !== this.trainId) {
        this.trainId = id;
        this.loadTrain();
        this.loadSchedules();
      }
    });
  }

  loadTrain(): void {
    this.trainService.getTrainById(this.trainId).subscribe({
      next: t => this.train.set(t),
      error: () => {}
    });
  }

  loadSchedules(): void {
    this.loading.set(true);
    this.trainService.getTrainSchedules(this.trainId).subscribe({
      next: res => {
        const normalized = (res ?? []).map((s: any) => ({
          ...s,
          id: s.id ?? s.Id
        }));
        this.schedules.set(normalized);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message || 'Failed to load schedules.');
        this.loading.set(false);
      }
    });
  }

  openAdd(): void {
    this.editing.set(null);
    this.form = {
      runDate: this.today,
      availableSeats: 100
    };
    this.showForm.set(true);
  }

  openEdit(s: TrainSchedule): void {
    this.editing.set(s);
    this.form = {
      runDate: s.runDate,
      availableSeats: s.availableSeats
    };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.formError.set('');
  }

  save(): void {
    if (!this.form.runDate) {
      this.formError.set('Please select a date');
      return;
    }
    this.saving.set(true);
    this.formError.set('');

    const payload: any = {
      trainId: this.trainId,
      runDate: this.form.runDate,
      availableSeats: Number(this.form.availableSeats) || 0
    };

    const obs = this.editing()
      ? this.trainService.updateSchedule(this.editing()!.id, payload)
      : this.trainService.createSchedule(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadSchedules();
      },
      error: err => {
        this.formError.set(err.error?.message || 'Save failed.');
        this.saving.set(false);
      }
    });
  }

  deleteSchedule(id: number): void {
    if (!confirm('Delete this schedule date?')) return;
    this.trainService.deleteSchedule(id).subscribe({
      next: () => this.schedules.update(prev => prev.filter(s => s.id !== id)),
      error: err => this.error.set(err.error?.message || 'Delete failed.')
    });
  }

  // --- SEAT / COACH MANAGEMENT METHODS ---

  openSeats(schedule: TrainSchedule): void {
    this.selectedScheduleForSeats.set(schedule);
    this.showSeatsModal.set(true);
    this.loadSeats(schedule.id);
  }

  closeSeatsModal(): void {
    this.showSeatsModal.set(false);
    this.selectedScheduleForSeats.set(null);
    this.seats.set([]);
  }

  loadSeats(scheduleId: number): void {
    this.seatsLoading.set(true);
    this.seatsError.set('');
    this.trainService.getTrainSeats(scheduleId).subscribe({
      next: res => {
        const sorted = (res ?? []).sort((a, b) => (a.trainSeatOrder || 0) - (b.trainSeatOrder || 0));
        this.seats.set(sorted);
        this.seatsLoading.set(false);

        // Auto-sync overall availableSeats on schedule
        if (sorted.length > 0) {
          const totalAvailable = sorted.reduce((sum, s) => sum + (Number(s.availableSeats) || 0), 0);
          const currentSchedule = this.selectedScheduleForSeats();
          if (currentSchedule && currentSchedule.availableSeats !== totalAvailable) {
            this.syncScheduleSeats(currentSchedule, totalAvailable);
          }
        }
      },
      error: err => {
        this.seatsError.set(err.error?.message || 'Failed to load coach seats.');
        this.seatsLoading.set(false);
      }
    });
  }

  syncScheduleSeats(schedule: TrainSchedule, totalAvailable: number): void {
    const payload = {
      trainId: this.trainId,
      runDate: schedule.runDate,
      availableSeats: totalAvailable
    };
    this.trainService.updateSchedule(schedule.id, payload).subscribe({
      next: () => {
        schedule.availableSeats = totalAvailable;
        this.schedules.update(list => list.map(s => s.id === schedule.id ? { ...s, availableSeats: totalAvailable } : s));
      },
      error: () => {}
    });
  }

  openAddSeat(): void {
    this.editingSeat.set(null);
    const nextOrder = (this.seats().length || 0) + 1;
    this.seatForm = {
      coachType: 'AC' as CoachType,
      trainSeatOrder: nextOrder,
      totalSeats: 60,
      availableSeats: 60,
      price: 1200
    };
    this.showSeatForm.set(true);
  }

  openEditSeat(st: TrainSeat): void {
    this.editingSeat.set(st);
    this.seatForm = {
      coachType: st.coachType,
      trainSeatOrder: st.trainSeatOrder,
      totalSeats: st.totalSeats,
      availableSeats: st.availableSeats,
      price: st.price
    };
    this.showSeatForm.set(true);
  }

  closeSeatForm(): void {
    this.showSeatForm.set(false);
    this.seatFormError.set('');
  }

  saveSeat(): void {
    const schedule = this.selectedScheduleForSeats();
    if (!schedule) return;

    if (!this.seatForm.coachType) {
      this.seatFormError.set('Please select a coach class.');
      return;
    }

    this.savingSeat.set(true);
    this.seatFormError.set('');

    const payload: Partial<TrainSeat> = {
      trainScheduleId: schedule.id,
      coachType: this.seatForm.coachType,
      totalSeats: Number(this.seatForm.totalSeats) || 0,
      availableSeats: Number(this.seatForm.availableSeats) || 0,
      price: Number(this.seatForm.price) || 0,
      trainSeatOrder: Number(this.seatForm.trainSeatOrder) || 1
    };

    const obs = this.editingSeat()
      ? this.trainService.updateTrainSeat(this.editingSeat()!.id, payload)
      : this.trainService.createTrainSeat(payload);

    obs.subscribe({
      next: () => {
        this.savingSeat.set(false);
        this.closeSeatForm();
        this.loadSeats(schedule.id);
      },
      error: err => {
        this.seatFormError.set(err.error?.message || 'Failed to save coach seat tier.');
        this.savingSeat.set(false);
      }
    });
  }

  deleteSeat(seatId: number): void {
    if (!confirm('Delete this coach tier?')) return;
    const schedule = this.selectedScheduleForSeats();
    this.trainService.deleteTrainSeat(seatId).subscribe({
      next: () => {
        if (schedule) this.loadSeats(schedule.id);
      },
      error: err => {
        this.seatsError.set(err.error?.message || 'Failed to delete coach tier.');
      }
    });
  }
}
