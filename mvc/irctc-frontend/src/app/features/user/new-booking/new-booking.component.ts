import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { TrainService } from '../../../core/services/train.service';
import { StationService } from '../../../core/services/station.service';
import { AuthService } from '../../../core/services/auth.service';
import { BookingRequest, PassengerRequest, BookingResponse } from '../../../core/models/booking.model';
import { CoachType } from '../../../core/models/train.model';

@Component({
  selector: 'app-new-booking',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <h2>🎫 Book a Ticket</h2>
    </div>

    @if (success()) {
      <div class="success-card">
        <h3>✅ Booking Confirmed!</h3>
        <div class="pnr-box">
          <label>Your PNR</label>
          <span class="pnr">{{ success()!.pnr }}</span>
        </div>
        <div class="details-grid">
          <div><label>Train</label><span>{{ success()!.trainName }}</span></div>
          <div><label>Date</label><span>{{ success()!.journeyDate }}</span></div>
          <div><label>From</label><span>{{ success()!.sourceStation?.name }}</span></div>
          <div><label>To</label><span>{{ success()!.destinationStation?.name }}</span></div>
          <div><label>Total Fare</label><span class="fare">₹{{ success()!.totalFare }}</span></div>
          <div><label>Status</label><span>{{ success()!.bookingStatus }}</span></div>
        </div>
        <div class="passengers-section">
          <h4>Passengers & Seats</h4>
          @for (p of success()!.passengers; track p.seatNumber) {
            <div class="passenger-row">
              <span>{{ p.name }}</span>
              <span>{{ p.coachType }}</span>
              <span>Seat {{ p.seatNumber }}</span>
            </div>
          }
        </div>
        <button (click)="reset()" class="btn-secondary">Book Another</button>
      </div>
    }

    @if (!success()) {
      <div class="booking-form-card">
        <form (ngSubmit)="submitBooking()">
          <div class="section-title">Journey Details</div>
          <div class="form-grid">
            <div class="form-group">
              <label>Train Schedule ID</label>
              <input [(ngModel)]="req.trainScheduleId" name="scheduleId" type="number" placeholder="Schedule ID" required class="form-control" />
            </div>
            <div class="form-group">
              <label>Source Station ID</label>
              <input [(ngModel)]="req.sourceStationId" name="srcId" type="number" placeholder="Source Station ID" required class="form-control" />
            </div>
            <div class="form-group">
              <label>Destination Station ID</label>
              <input [(ngModel)]="req.destinationStationId" name="dstId" type="number" placeholder="Destination Station ID" required class="form-control" />
            </div>
            <div class="form-group">
              <label>Coach Type</label>
              <select [(ngModel)]="req.coachType" name="coach" class="form-control">
                <option value="AC">AC</option>
                <option value="SLEEPER">SLEEPER</option>
                <option value="GENERAL">GENERAL</option>
              </select>
            </div>
          </div>

          <div class="section-title">
            Passengers
            <button type="button" (click)="addPassenger()" class="btn-add">+ Add Passenger</button>
          </div>

          @for (p of passengers; track $index; let i = $index) {
            <div class="passenger-form">
              <span class="p-label">Passenger {{ i + 1 }}</span>
              <div class="passenger-fields">
                <input [(ngModel)]="p.name" [name]="'pname_' + i" placeholder="Full Name" required class="form-control" />
                <input [(ngModel)]="p.age" [name]="'page_' + i" type="number" placeholder="Age" min="1" required class="form-control sm" />
                <select [(ngModel)]="p.gender" [name]="'pgender_' + i" class="form-control sm">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                @if (passengers.length > 1) {
                  <button type="button" (click)="removePassenger(i)" class="btn-remove">✕</button>
                }
              </div>
            </div>
          }

          @if (error()) {
            <div class="alert alert-error">{{ error() }}</div>
          }

          <div class="form-actions">
            <button type="submit" class="btn-submit" [disabled]="loading()">
              {{ loading() ? 'Booking...' : '🎫 Confirm Booking' }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .page-header h2 { color:#1a237e; font-size:1.8rem; margin-bottom:1.5rem; }
    .booking-form-card { background:white; border-radius:10px; padding:2rem; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
    .section-title { font-weight:700; color:#1a237e; font-size:1rem; margin:1.25rem 0 0.75rem; display:flex; align-items:center; gap:1rem; }
    .form-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px,1fr)); gap:1rem; }
    .form-group { display:flex; flex-direction:column; gap:0.4rem; }
    .form-group label { font-size:0.82rem; font-weight:600; color:#555; }
    .form-control { padding:0.65rem 0.9rem; border:1px solid #ddd; border-radius:6px; font-size:0.95rem; outline:none; }
    .form-control:focus { border-color:#1a237e; }
    .form-control.sm { width:90px; }
    .btn-add { background:#e8eaf6; color:#1a237e; border:none; padding:0.35rem 0.85rem; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.85rem; }
    .passenger-form { background:#f8f9ff; border-radius:8px; padding:0.75rem 1rem; margin-bottom:0.75rem; }
    .p-label { font-size:0.8rem; font-weight:600; color:#555; display:block; margin-bottom:0.5rem; }
    .passenger-fields { display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap; }
    .btn-remove { background:#ffebee; color:#c62828; border:none; padding:0.4rem 0.75rem; border-radius:6px; cursor:pointer; font-weight:700; }
    .alert-error { background:#ffebee; color:#c62828; padding:0.75rem 1rem; border-radius:6px; margin:1rem 0; }
    .form-actions { margin-top:1.5rem; }
    .btn-submit { padding:0.85rem 2.5rem; background:#ff6f00; color:white; border:none; border-radius:6px; font-size:1rem; font-weight:600; cursor:pointer; }
    .btn-submit:disabled { opacity:0.6; cursor:not-allowed; }
    .success-card { background:white; border-radius:10px; padding:2rem; box-shadow:0 4px 20px rgba(0,0,0,0.1); border-top:4px solid #2e7d32; }
    .success-card h3 { color:#2e7d32; font-size:1.5rem; margin-bottom:1rem; }
    .pnr-box { background:#e8f5e9; border-radius:8px; padding:1rem; text-align:center; margin-bottom:1rem; }
    .pnr-box label { font-size:0.8rem; color:#555; display:block; }
    .pnr { font-size:1.8rem; font-weight:700; color:#1a237e; letter-spacing:2px; }
    .details-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(140px,1fr)); gap:1rem; margin-bottom:1rem; }
    .details-grid div { display:flex; flex-direction:column; }
    .details-grid label { font-size:0.75rem; color:#888; }
    .details-grid span { font-weight:600; }
    .fare { color:#1a237e; font-size:1.1rem; }
    .passengers-section h4 { color:#333; margin-bottom:0.5rem; }
    .passenger-row { display:flex; gap:1.5rem; padding:0.5rem 0; border-bottom:1px solid #f0f0f0; }
    .btn-secondary { margin-top:1rem; background:#1a237e; color:white; border:none; padding:0.7rem 1.5rem; border-radius:6px; cursor:pointer; font-weight:600; }
  `]
})
export class NewBookingComponent implements OnInit {
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  req: BookingRequest = {
    userId: 0,
    trainScheduleId: 0,
    sourceStationId: 0,
    destinationStationId: 0,
    coachType: 'AC' as CoachType,
    passengers: []
  };

  passengers: PassengerRequest[] = [{ name: '', age: 0, gender: 'MALE' }];
  loading = signal(false);
  error = signal('');
  success = signal<BookingResponse | null>(null);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) this.req.userId = user.id;
    // Pre-fill from query params if coming from search
    this.route.queryParams.subscribe(params => {
      if (params['trainScheduleId']) this.req.trainScheduleId = Number(params['trainScheduleId']);
      if (params['sourceStationId']) this.req.sourceStationId = Number(params['sourceStationId']);
      if (params['destinationStationId']) this.req.destinationStationId = Number(params['destinationStationId']);
      if (params['coachType']) this.req.coachType = params['coachType'] as CoachType;
    });
  }

  addPassenger(): void {
    this.passengers.push({ name: '', age: 0, gender: 'MALE' });
  }

  removePassenger(index: number): void {
    this.passengers.splice(index, 1);
  }

  submitBooking(): void {
    this.loading.set(true);
    this.error.set('');
    this.req.passengers = [...this.passengers];
    this.bookingService.createBooking(this.req).subscribe({
      next: res => { this.success.set(res); this.loading.set(false); },
      error: err => {
        this.error.set(err.error?.message || 'Booking failed. Please check details and try again.');
        this.loading.set(false);
      }
    });
  }

  reset(): void {
    this.success.set(null);
    this.passengers = [{ name: '', age: 0, gender: 'MALE' }];
  }
}
