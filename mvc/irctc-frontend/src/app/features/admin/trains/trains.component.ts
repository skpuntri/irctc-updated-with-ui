import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TrainService } from '../../../core/services/train.service';
import { StationService } from '../../../core/services/station.service';
import { Train, Station } from '../../../core/models/train.model';

@Component({
  selector: 'app-trains',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <h2>🚂 Manage Trains</h2>
      <button (click)="openAdd()" class="btn-primary">+ Add Train</button>
    </div>

    @if (showForm()) {
      <div class="modal-overlay" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editing() ? 'Edit Train' : 'Add Train' }}</h3>
          <form (ngSubmit)="save()">
            <div class="form-grid">
              <div class="form-group">
                <label>Train Number</label>
                <input [(ngModel)]="form.number" name="num" placeholder="e.g. 12301" required class="form-control" />
              </div>
              <div class="form-group">
                <label>Train Name</label>
                <input [(ngModel)]="form.name" name="name" placeholder="e.g. Rajdhani Express" required class="form-control" />
              </div>
              <div class="form-group">
                <label>Total Distance (km)</label>
                <input [(ngModel)]="form.totalDistance" name="dist" type="number" placeholder="1400" class="form-control" />
              </div>
              <div class="form-group">
                <label>Source Station</label>
                <select [(ngModel)]="form.sourceStationId" name="srcId" class="form-control">
                  <option [ngValue]="undefined">-- Select Source Station --</option>
                  @for (s of stations(); track s.id) {
                    <option [ngValue]="s.id">{{ s.name }} ({{ s.code }})</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Destination Station</label>
                <select [(ngModel)]="form.destinationStationId" name="dstId" class="form-control">
                  <option [ngValue]="undefined">-- Select Destination Station --</option>
                  @for (s of stations(); track s.id) {
                    <option [ngValue]="s.id">{{ s.name }} ({{ s.code }})</option>
                  }
                </select>
              </div>
            </div>
            @if (formError()) { <div class="alert alert-error">{{ formError() }}</div> }
            <div class="modal-actions">
              <button type="button" (click)="closeForm()" class="btn-cancel">Cancel</button>
              <button type="submit" class="btn-save" [disabled]="saving()">
                {{ saving() ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (loading()) { <div class="loading">Loading trains...</div> }
    @if (successMessage()) {
      <div class="alert alert-success">
        <span>{{ successMessage() }}</span>
        <button type="button" class="close-btn" (click)="successMessage.set('')">✕</button>
      </div>
    }
    @if (error()) {
      <div class="alert alert-error">
        <span>{{ error() }}</span>
        <button type="button" class="close-btn" (click)="error.set('')">✕</button>
      </div>
    }

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th><th>Number</th><th>Name</th><th>Distance</th><th>Source</th><th>Destination</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (t of trains(); track t.id) {
            <tr>
              <td>{{ t.id }}</td>
              <td><span class="badge">{{ t.number }}</span></td>
              <td>{{ t.name }}</td>
              <td>{{ t.totalDistance }} km</td>
              <td>
                <span class="station-name">{{ t.sourceStation?.name || t.sourceStation?.code || '—' }}</span>
                @if (t.sourceStation?.code && t.sourceStation?.name) {
                  <span class="station-code">({{ t.sourceStation?.code }})</span>
                }
              </td>
              <td>
                <span class="station-name">{{ t.destinationStation?.name || t.destinationStation?.code || '—' }}</span>
                @if (t.destinationStation?.code && t.destinationStation?.name) {
                  <span class="station-code">({{ t.destinationStation?.code }})</span>
                }
              </td>
              <td class="actions">
                <button type="button" (click)="goToRoutes(t.id)" class="btn-route" title="Manage Route Stops">🛤️ Stops</button>
                <button type="button" (click)="goToSchedules(t.id)" class="btn-schedule" title="Manage Schedule Dates">📅 Dates</button>
                <button type="button" (click)="openEdit(t)" class="btn-edit">Edit</button>
                <button type="button" (click)="deleteTrain(t.id)" class="btn-delete">Delete</button>
              </td>
            </tr>
          }
          @if (!loading() && trains().length === 0) {
            <tr><td colspan="7" class="empty-row">No trains found.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .page-header h2 { color:#1a237e; font-size:1.8rem; }
    .btn-primary { background:#1a237e; color:white; padding:0.6rem 1.25rem; border:none; border-radius:6px; cursor:pointer; font-weight:600; }
    .alert-success { background:#e8f5e9; color:#2e7d32; padding:0.75rem 1rem; border-radius:6px; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; font-weight:500; }
    .alert-error { background:#ffebee; color:#c62828; padding:0.75rem 1rem; border-radius:6px; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; font-weight:500; }
    .close-btn { background:none; border:none; color:inherit; font-weight:bold; cursor:pointer; font-size:1.1rem; margin-left:1rem; line-height:1; }
    .table-card { background:white; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.08); overflow:auto; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { background:#1a237e; color:white; padding:0.75rem 1rem; text-align:left; font-size:0.85rem; }
    .data-table td { padding:0.75rem 1rem; border-bottom:1px solid #f0f0f0; font-size:0.9rem; }
    .data-table tr:hover td { background:#f8f9ff; }
    .badge { background:#e8eaf6; color:#1a237e; padding:0.2rem 0.5rem; border-radius:4px; font-size:0.8rem; font-weight:600; }
    .station-name { font-weight: 600; color: #1a237e; }
    .station-code { color: #555; font-size: 0.8rem; margin-left: 0.35rem; background: #e8eaf6; padding: 0.15rem 0.4rem; border-radius: 4px; }
    .actions { display:flex; gap:0.4rem; align-items:center; }
    .btn-route { background:#e8eaf6; color:#1a237e; border:none; padding:0.35rem 0.65rem; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.82rem; }
    .btn-route:hover { background:#c5cae9; }
    .btn-schedule { background:#e8f5e9; color:#2e7d32; border:none; padding:0.35rem 0.65rem; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.82rem; }
    .btn-schedule:hover { background:#c8e6c9; }
    .btn-edit { background:#fff8e1; color:#f57f17; border:none; padding:0.35rem 0.75rem; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.82rem; }
    .btn-delete { background:#ffebee; color:#c62828; border:none; padding:0.35rem 0.75rem; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.82rem; }
    .empty-row { text-align:center; color:#aaa; padding:2rem; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:999; }
    .modal { background:white; border-radius:12px; padding:2rem; width:100%; max-width:540px; box-shadow:0 8px 40px rgba(0,0,0,0.2); }
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
export class TrainsComponent implements OnInit {
  private trainService = inject(TrainService);
  private stationService = inject(StationService);
  private router = inject(Router);

  goToRoutes(trainId: number): void {
    this.router.navigate(['/admin/trains', trainId, 'routes']);
  }

  goToSchedules(trainId: number): void {
    this.router.navigate(['/admin/trains', trainId, 'schedules']);
  }

  trains = signal<Train[]>([]);
  stations = signal<Station[]>([]);
  loading = signal(true);
  error = signal('');
  successMessage = signal('');
  showForm = signal(false);
  editing = signal<Train | null>(null);
  saving = signal(false);
  formError = signal('');
  form: any = {};

  ngOnInit(): void {
    this.loadTrains();
    this.loadStations();
  }

  loadTrains(): void {
    this.loading.set(true);
    this.trainService.getAllTrains().subscribe({
      next: res => {
        this.trains.set(Array.isArray(res) ? res : ((res as any).content ?? []));
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message || 'Failed to load trains.');
        this.loading.set(false);
      }
    });
  }

  loadStations(): void {
    this.stationService.getStations(0, 500).subscribe({
      next: res => this.stations.set(res.content ?? []),
      error: () => {}
    });
  }

  openAdd(): void {
    this.editing.set(null);
    this.form = {
      number: '',
      name: '',
      totalDistance: null,
      sourceStationId: undefined,
      destinationStationId: undefined
    };
    this.showForm.set(true);
  }

  openEdit(t: Train): void {
    this.editing.set(t);
    this.form = {
      ...t,
      sourceStationId: t.sourceStation?.id,
      destinationStationId: t.destinationStation?.id
    };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.formError.set('');
  }

  save(): void {
    this.formError.set('');
    const num = (this.form.number || '').trim();

    if (!num) {
      this.formError.set('Train number is required.');
      return;
    }

    if (!this.editing()) {
      const exists = this.trains().find(t => t.number?.trim().toLowerCase() === num.toLowerCase());
      if (exists) {
        this.formError.set(`A train with number '${num}' already exists (ID: #${exists.id} - ${exists.name}).`);
        return;
      }
    }

    this.saving.set(true);
    const payload: any = {
      number: num,
      name: (this.form.name || '').trim(),
      totalDistance: this.form.totalDistance
    };
    if (this.form.sourceStationId) {
      payload.sourceStation = { id: Number(this.form.sourceStationId) };
    }
    if (this.form.destinationStationId) {
      payload.destinationStation = { id: Number(this.form.destinationStationId) };
    }

    const obs = this.editing()
      ? this.trainService.updateTrain(this.editing()!.id, payload)
      : this.trainService.createTrain(payload);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadTrains();
      },
      error: err => {
        this.formError.set(err.error?.message || 'Save failed.');
        this.saving.set(false);
      }
    });
  }

  deleteTrain(id: number): void {
    const trainToDelete = this.trains().find(t => t.id === id);
    const label = trainToDelete ? `"${trainToDelete.name}" (${trainToDelete.number})` : `Train ID #${id}`;
    if (!confirm(`Are you sure you want to delete train ${label}?`)) return;

    this.error.set('');
    this.successMessage.set('');

    this.trainService.deleteTrain(id).subscribe({
      next: (res: any) => {
        this.trains.update(prev => prev.filter(t => t.id !== id));
        const backendMsg = res?.body?.message || res?.message;
        const status = res?.status ? ` [HTTP ${res.status}]` : '';
        this.successMessage.set(
          backendMsg
            ? `✅ ${backendMsg}`
            : `✅ Train ${label} deleted successfully${status}.`
        );
      },
      error: err => {
        const errorMsg = err.error?.message || err.error?.error || err.message || 'Delete failed.';
        this.error.set(`❌ Failed to delete train ${label}: ${errorMsg}`);
      }
    });
  }
}
