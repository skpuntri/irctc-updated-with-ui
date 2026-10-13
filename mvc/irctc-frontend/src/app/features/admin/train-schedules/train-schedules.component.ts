import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TrainService } from '../../../core/services/train.service';
import { Train, TrainSchedule } from '../../../core/models/train.model';

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

    <!-- Modal Form -->
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
                <label>Available Seats</label>
                <input [(ngModel)]="form.availableSeats" name="availableSeats" type="number" min="0" placeholder="e.g. 120" required class="form-control" />
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

    <!-- Schedule Table -->
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Schedule ID</th>
            <th>Run Date</th>
            <th>Available Seats</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (s of sortedSchedules(); track s.id) {
            <tr>
              <td><span class="id-badge">#{{ s.id }}</span></td>
              <td><strong>📅 {{ s.runDate }}</strong></td>
              <td><span class="seats-badge">{{ s.availableSeats }} seats</span></td>
              <td class="actions">
                <button (click)="openEdit(s)" class="btn-edit">Edit</button>
                <button (click)="deleteSchedule(s.id)" class="btn-delete">Delete</button>
              </td>
            </tr>
          }
          @if (!loading() && schedules().length === 0) {
            <tr><td colspan="4" class="empty-row">No run schedules added for this train yet. Click "+ Add Schedule Date" above.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .page-header h2 { color:#1a237e; font-size:1.6rem; margin-bottom:0.25rem; }
    .back-link { color:#ff6f00; text-decoration:none; font-weight:600; font-size:0.9rem; }
    .btn-primary { background:#1a237e; color:white; padding:0.6rem 1.25rem; border:none; border-radius:6px; cursor:pointer; font-weight:600; }
    .loading { text-align:center; padding:2rem; color:#555; }
    .alert-error { background:#ffebee; color:#c62828; padding:0.75rem 1rem; border-radius:6px; margin-bottom:1rem; }
    .table-card { background:white; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.08); overflow:auto; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { background:#1a237e; color:white; padding:0.75rem 1rem; text-align:left; font-size:0.85rem; }
    .data-table td { padding:0.75rem 1rem; border-bottom:1px solid #f0f0f0; font-size:0.9rem; }
    .data-table tr:hover td { background:#f8f9ff; }
    .id-badge { background:#e8eaf6; color:#1a237e; padding:0.2rem 0.5rem; border-radius:4px; font-weight:700; font-size:0.85rem; }
    .seats-badge { background:#e8f5e9; color:#2e7d32; padding:0.2rem 0.6rem; border-radius:4px; font-weight:700; font-size:0.85rem; }
    .actions { display:flex; gap:0.5rem; }
    .btn-edit { background:#fff8e1; color:#f57f17; border:none; padding:0.35rem 0.75rem; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.82rem; }
    .btn-delete { background:#ffebee; color:#c62828; border:none; padding:0.35rem 0.75rem; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.82rem; }
    .empty-row { text-align:center; color:#aaa; padding:2.5rem; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:999; }
    .modal { background:white; border-radius:12px; padding:2rem; width:100%; max-width:480px; }
    .modal h3 { color:#1a237e; margin-bottom:1.25rem; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
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

  get sortedSchedules() {
    return () => [...this.schedules()].sort((a, b) => (a.runDate || '').localeCompare(b.runDate || ''));
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.trainId = Number(params['trainId']);
      if (this.trainId) {
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
      next: res => { this.schedules.set(res ?? []); this.loading.set(false); },
      error: err => { this.error.set(err.error?.message || 'Failed to load schedules.'); this.loading.set(false); }
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
}
