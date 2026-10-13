import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TrainService } from '../../../core/services/train.service';
import { Train } from '../../../core/models/train.model';

@Component({
  selector: 'app-trains',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
                <label>Source Station ID</label>
                <input [(ngModel)]="form.sourceStationId" name="srcId" type="number" placeholder="Station ID" class="form-control" />
              </div>
              <div class="form-group">
                <label>Destination Station ID</label>
                <input [(ngModel)]="form.destinationStationId" name="dstId" type="number" placeholder="Station ID" class="form-control" />
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
    @if (error()) { <div class="alert alert-error">{{ error() }}</div> }

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
              <td>{{ t.sourceStation?.code || '—' }}</td>
              <td>{{ t.destinationStation?.code || '—' }}</td>
              <td class="actions">
                <a [routerLink]="['/admin/trains', t.id, 'routes']" class="btn-route">🛤️ Stops</a>
                <button (click)="openEdit(t)" class="btn-edit">Edit</button>
                <button (click)="deleteTrain(t.id)" class="btn-delete">Delete</button>
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
    .loading { text-align:center; padding:2rem; color:#555; }
    .alert-error { background:#ffebee; color:#c62828; padding:0.75rem 1rem; border-radius:6px; margin-bottom:1rem; }
    .table-card { background:white; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.08); overflow:auto; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { background:#1a237e; color:white; padding:0.75rem 1rem; text-align:left; font-size:0.85rem; }
    .data-table td { padding:0.75rem 1rem; border-bottom:1px solid #f0f0f0; font-size:0.9rem; }
    .data-table tr:hover td { background:#f8f9ff; }
    .badge { background:#e8eaf6; color:#1a237e; padding:0.2rem 0.5rem; border-radius:4px; font-size:0.8rem; font-weight:600; }
    .actions { display:flex; gap:0.4rem; align-items:center; }
    .btn-route { background:#e8eaf6; color:#1a237e; padding:0.35rem 0.65rem; border-radius:4px; text-decoration:none; font-weight:600; font-size:0.82rem; }
    .btn-route:hover { background:#c5cae9; }
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

  trains = signal<Train[]>([]);
  loading = signal(true);
  error = signal('');
  showForm = signal(false);
  editing = signal<Train | null>(null);
  saving = signal(false);
  formError = signal('');
  form: any = {};

  ngOnInit(): void { this.loadTrains(); }

  loadTrains(): void {
    this.loading.set(true);
    this.trainService.getAllTrains().subscribe({
      next: res => { this.trains.set(Array.isArray(res) ? res : ((res as any).content ?? [])); this.loading.set(false); },
      error: err => { this.error.set(err.error?.message || 'Failed to load trains.'); this.loading.set(false); }
    });
  }

  openAdd(): void { this.editing.set(null); this.form = {}; this.showForm.set(true); }
  openEdit(t: Train): void { this.editing.set(t); this.form = { ...t }; this.showForm.set(true); }
  closeForm(): void { this.showForm.set(false); this.formError.set(''); }

  save(): void {
    this.saving.set(true);
    this.formError.set('');
    const payload: any = {
      number: this.form.number,
      name: this.form.name,
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
      next: () => { this.saving.set(false); this.closeForm(); this.loadTrains(); },
      error: err => { this.formError.set(err.error?.message || 'Save failed.'); this.saving.set(false); }
    });
  }

  deleteTrain(id: number): void {
    if (!confirm('Delete this train?')) return;
    this.trainService.deleteTrain(id).subscribe({
      next: () => this.trains.update(prev => prev.filter(t => t.id !== id)),
      error: err => this.error.set(err.error?.message || 'Delete failed.')
    });
  }
}
