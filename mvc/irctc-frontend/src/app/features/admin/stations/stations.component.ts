import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StationService } from '../../../core/services/station.service';
import { Station } from '../../../core/models/train.model';

@Component({
  selector: 'app-stations',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <h2>🏢 Manage Stations</h2>
      <button (click)="openAdd()" class="btn-primary">+ Add Station</button>
    </div>

    @if (showForm()) {
      <div class="modal-overlay" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editing() ? 'Edit Station' : 'Add Station' }}</h3>
          <form (ngSubmit)="save()">
            <div class="form-grid">
              <div class="form-group">
                <label>Station Code</label>
                <input [(ngModel)]="form.code" name="code" placeholder="e.g. NDLS" required class="form-control" style="text-transform:uppercase" />
              </div>
              <div class="form-group">
                <label>Station Name</label>
                <input [(ngModel)]="form.name" name="name" placeholder="New Delhi" required class="form-control" />
              </div>
              <div class="form-group">
                <label>City</label>
                <input [(ngModel)]="form.city" name="city" placeholder="New Delhi" class="form-control" />
              </div>
              <div class="form-group">
                <label>State</label>
                <input [(ngModel)]="form.state" name="state" placeholder="Delhi" class="form-control" />
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

    @if (loading()) { <div class="loading">Loading stations...</div> }
    @if (error()) { <div class="alert alert-error">{{ error() }}</div> }

    <div class="search-bar">
      <input [(ngModel)]="searchQuery" placeholder="🔍 Filter stations..." class="form-control" />
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr><th>ID</th><th>Code</th><th>Name</th><th>City</th><th>State</th><th>Actions</th></tr>
        </thead>
        <tbody>
          @for (s of filteredStations(); track s.id) {
            <tr>
              <td>{{ s.id }}</td>
              <td><span class="code-badge">{{ s.code }}</span></td>
              <td>{{ s.name }}</td>
              <td>{{ s.city }}</td>
              <td>{{ s.state }}</td>
              <td class="actions">
                <button (click)="openEdit(s)" class="btn-edit">Edit</button>
                <button (click)="deleteStation(s.id)" class="btn-delete">Delete</button>
              </td>
            </tr>
          }
          @if (!loading() && filteredStations().length === 0) {
            <tr><td colspan="6" class="empty-row">No stations found.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .page-header h2 { color:#1a237e; font-size:1.8rem; }
    .btn-primary { background:#1a237e; color:white; padding:0.6rem 1.25rem; border:none; border-radius:6px; cursor:pointer; font-weight:600; }
    .search-bar { margin-bottom:1rem; }
    .form-control { padding:0.65rem 0.9rem; border:1px solid #ddd; border-radius:6px; font-size:0.9rem; outline:none; width:100%; box-sizing:border-box; }
    .form-control:focus { border-color:#1a237e; }
    .loading, .alert-error { padding:1rem; border-radius:6px; }
    .alert-error { background:#ffebee; color:#c62828; margin-bottom:1rem; }
    .table-card { background:white; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.08); overflow:auto; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { background:#1a237e; color:white; padding:0.75rem 1rem; text-align:left; font-size:0.85rem; }
    .data-table td { padding:0.75rem 1rem; border-bottom:1px solid #f0f0f0; font-size:0.9rem; }
    .data-table tr:hover td { background:#f8f9ff; }
    .code-badge { background:#e3f2fd; color:#1565c0; padding:0.2rem 0.5rem; border-radius:4px; font-weight:700; font-size:0.85rem; }
    .actions { display:flex; gap:0.5rem; }
    .btn-edit { background:#fff8e1; color:#f57f17; border:none; padding:0.35rem 0.75rem; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.82rem; }
    .btn-delete { background:#ffebee; color:#c62828; border:none; padding:0.35rem 0.75rem; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.82rem; }
    .empty-row { text-align:center; color:#aaa; padding:2rem; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:999; }
    .modal { background:white; border-radius:12px; padding:2rem; width:100%; max-width:500px; }
    .modal h3 { color:#1a237e; margin-bottom:1.25rem; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .form-group { display:flex; flex-direction:column; gap:0.4rem; }
    .form-group label { font-size:0.82rem; font-weight:600; color:#555; }
    .modal-actions { display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.25rem; }
    .btn-cancel { background:#f5f5f5; color:#333; border:none; padding:0.6rem 1.25rem; border-radius:6px; cursor:pointer; }
    .btn-save { background:#1a237e; color:white; border:none; padding:0.6rem 1.5rem; border-radius:6px; cursor:pointer; font-weight:600; }
    .btn-save:disabled { opacity:0.6; }
  `]
})
export class StationsComponent implements OnInit {
  private stationService = inject(StationService);

  stations = signal<Station[]>([]);
  loading = signal(true);
  error = signal('');
  showForm = signal(false);
  editing = signal<Station | null>(null);
  saving = signal(false);
  formError = signal('');
  form: any = {};
  searchQuery = '';

  get filteredStations() {
    return () => this.stations().filter(s =>
      !this.searchQuery ||
      s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      s.city?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  ngOnInit(): void { this.loadStations(); }

  loadStations(): void {
    this.loading.set(true);
    this.stationService.getStations(0, 200).subscribe({
      next: res => { this.stations.set(res.content ?? []); this.loading.set(false); },
      error: err => { this.error.set(err.error?.message || 'Failed to load stations.'); this.loading.set(false); }
    });
  }

  openAdd(): void { this.editing.set(null); this.form = {}; this.showForm.set(true); }
  openEdit(s: Station): void { this.editing.set(s); this.form = { ...s }; this.showForm.set(true); }
  closeForm(): void { this.showForm.set(false); this.formError.set(''); }

  save(): void {
    this.saving.set(true);
    this.formError.set('');
    const obs = this.editing()
      ? this.stationService.updateStation(this.editing()!.id, this.form)
      : this.stationService.createStation(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.loadStations(); },
      error: err => { this.formError.set(err.error?.message || 'Save failed.'); this.saving.set(false); }
    });
  }

  deleteStation(id: number): void {
    if (!confirm('Delete this station?')) return;
    this.stationService.deleteStation(id).subscribe({
      next: () => this.stations.update(prev => prev.filter(s => s.id !== id)),
      error: err => this.error.set(err.error?.message || 'Delete failed.')
    });
  }
}
