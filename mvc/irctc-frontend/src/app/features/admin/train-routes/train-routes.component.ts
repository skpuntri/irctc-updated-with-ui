import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TrainService } from '../../../core/services/train.service';
import { StationService } from '../../../core/services/station.service';
import { Train, TrainRoute, Station } from '../../../core/models/train.model';

@Component({
  selector: 'app-train-routes',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>🛤️ Route Stops for {{ train()?.name || 'Train' }} ({{ train()?.number }})</h2>
        <a routerLink="/admin/trains" class="back-link">← Back to Trains</a>
      </div>
      <button (click)="openAdd()" class="btn-primary">+ Add Stop / Station</button>
    </div>

    @if (loading()) { <div class="loading">Loading routes...</div> }
    @if (error()) { <div class="alert alert-error">{{ error() }}</div> }

    <!-- Modal Form -->
    @if (showForm()) {
      <div class="modal-overlay" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editing() ? 'Edit Route Stop' : 'Add Route Stop' }}</h3>
          <form (ngSubmit)="save()">
            <div class="form-grid">
              <div class="form-group">
                <label>Station</label>
                <select [(ngModel)]="form.stationId" name="stationId" required class="form-control">
                  <option [ngValue]="null" disabled>Select Station</option>
                  @for (s of stations(); track s.id) {
                    <option [ngValue]="s.id">{{ s.name }} ({{ s.code }})</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Stop Order (e.g. 1, 2, 3)</label>
                <input [(ngModel)]="form.stationOrder" name="stationOrder" type="number" min="1" required class="form-control" />
              </div>
              <div class="form-group">
                <label>Arrival Time (HH:mm)</label>
                <input [(ngModel)]="form.arrivalTime" name="arrivalTime" type="time" class="form-control" />
              </div>
              <div class="form-group">
                <label>Departure Time (HH:mm)</label>
                <input [(ngModel)]="form.departureTime" name="departureTime" type="time" class="form-control" />
              </div>
              <div class="form-group">
                <label>Halt (Minutes)</label>
                <input [(ngModel)]="form.haltMinutes" name="haltMinutes" type="number" min="0" placeholder="e.g. 5" class="form-control" />
              </div>
              <div class="form-group">
                <label>Distance From Source (km)</label>
                <input [(ngModel)]="form.distanceFromSource" name="distanceFromSource" type="number" min="0" placeholder="e.g. 150" class="form-control" />
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

    <!-- Route Table -->
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Station</th>
            <th>Code</th>
            <th>Arrival</th>
            <th>Departure</th>
            <th>Halt (min)</th>
            <th>Distance (km)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (r of sortedRoutes(); track r.id) {
            <tr>
              <td><span class="order-badge">#{{ r.stationOrder }}</span></td>
              <td><strong>{{ r.station.name || 'Station' }}</strong></td>
              <td><span class="code-badge">{{ r.station.code || '—' }}</span></td>
              <td>{{ r.arrivalTime || '--:--' }}</td>
              <td>{{ r.departureTime || '--:--' }}</td>
              <td>{{ r.haltMinutes }} min</td>
              <td>{{ r.distanceFromSource }} km</td>
              <td class="actions">
                <button (click)="openEdit(r)" class="btn-edit">Edit</button>
                <button (click)="deleteRoute(r.id)" class="btn-delete">Delete</button>
              </td>
            </tr>
          }
          @if (!loading() && routes().length === 0) {
            <tr><td colspan="8" class="empty-row">No stops configured for this train yet. Click "+ Add Stop / Station" above.</td></tr>
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
    .order-badge { background:#e8eaf6; color:#1a237e; padding:0.2rem 0.5rem; border-radius:4px; font-weight:700; font-size:0.85rem; }
    .code-badge { background:#e3f2fd; color:#1565c0; padding:0.2rem 0.5rem; border-radius:4px; font-weight:700; font-size:0.85rem; }
    .actions { display:flex; gap:0.5rem; }
    .btn-edit { background:#fff8e1; color:#f57f17; border:none; padding:0.35rem 0.75rem; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.82rem; }
    .btn-delete { background:#ffebee; color:#c62828; border:none; padding:0.35rem 0.75rem; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.82rem; }
    .empty-row { text-align:center; color:#aaa; padding:2.5rem; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:999; }
    .modal { background:white; border-radius:12px; padding:2rem; width:100%; max-width:540px; }
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
export class TrainRoutesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private trainService = inject(TrainService);
  private stationService = inject(StationService);

  trainId = 0;
  train = signal<Train | null>(null);
  routes = signal<TrainRoute[]>([]);
  stations = signal<Station[]>([]);
  loading = signal(true);
  error = signal('');
  showForm = signal(false);
  editing = signal<TrainRoute | null>(null);
  saving = signal(false);
  formError = signal('');
  form: any = {};

  sortedRoutes = computed(() =>
    [...this.routes()].sort((a, b) => (a.stationOrder || 0) - (b.stationOrder || 0))
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
      this.loadRoutes();
      this.loadStations();
    }

    this.route.params.subscribe(params => {
      const id = Number(params['trainId'] || this.route.parent?.snapshot.params['trainId']);
      if (id && id !== this.trainId) {
        this.trainId = id;
        this.loadTrain();
        this.loadRoutes();
        this.loadStations();
      }
    });
  }

  loadTrain(): void {
    this.trainService.getTrainById(this.trainId).subscribe({
      next: t => this.train.set(t),
      error: () => {}
    });
  }

  loadRoutes(): void {
    this.loading.set(true);
    this.trainService.getRoutesByTrain(this.trainId).subscribe({
      next: res => { this.routes.set(res ?? []); this.loading.set(false); },
      error: err => { this.error.set(err.error?.message || 'Failed to load routes.'); this.loading.set(false); }
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
      stationId: null,
      stationOrder: this.routes().length + 1,
      arrivalTime: '',
      departureTime: '',
      haltMinutes: 2,
      distanceFromSource: 0
    };
    this.showForm.set(true);
  }

  openEdit(r: TrainRoute): void {
    this.editing.set(r);
    this.form = {
      stationId: r.station?.id,
      stationOrder: r.stationOrder,
      arrivalTime: r.arrivalTime || '',
      departureTime: r.departureTime || '',
      haltMinutes: r.haltMinutes,
      distanceFromSource: r.distanceFromSource
    };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.formError.set('');
  }

  save(): void {
    if (!this.form.stationId) {
      this.formError.set('Please select a station');
      return;
    }
    this.saving.set(true);
    this.formError.set('');

    const payload: any = {
      train: { id: this.trainId },
      station: { id: Number(this.form.stationId) },
      stationOrder: Number(this.form.stationOrder),
      arrivalTime: this.form.arrivalTime ? this.form.arrivalTime + ':00' : null,
      departureTime: this.form.departureTime ? this.form.departureTime + ':00' : null,
      haltMinutes: Number(this.form.haltMinutes) || 0,
      distanceFromSource: Number(this.form.distanceFromSource) || 0
    };

    const obs = this.editing()
      ? this.trainService.updateRoute(this.editing()!.id, payload)
      : this.trainService.addRoute(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadRoutes();
      },
      error: err => {
        this.formError.set(err.error?.message || 'Save failed.');
        this.saving.set(false);
      }
    });
  }

  deleteRoute(id: number): void {
    if (!confirm('Remove this stop from route?')) return;
    this.trainService.deleteRoute(id).subscribe({
      next: () => this.routes.update(prev => prev.filter(r => r.id !== id)),
      error: err => this.error.set(err.error?.message || 'Delete failed.')
    });
  }
}
