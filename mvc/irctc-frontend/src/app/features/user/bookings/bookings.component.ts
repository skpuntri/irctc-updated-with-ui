import { Component, inject, signal, OnInit } from '@angular/core';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { BookingResponse } from '../../../core/models/booking.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-header">
      <h2>🎫 My Bookings</h2>
      <a routerLink="/user/bookings/new" class="btn-new">+ Book New Ticket</a>
    </div>

    @if (loading()) {
      <div class="loading">Loading your bookings...</div>
    }
    @if (error()) {
      <div class="alert alert-error">{{ error() }}</div>
    }
    @if (!loading() && bookings().length === 0) {
      <div class="empty-state">
        <p>📋 No bookings yet.</p>
        <a routerLink="/trains/search" class="link">Search trains to book your first ticket →</a>
      </div>
    }
    <div class="bookings-list">
      @for (b of bookings(); track (b.id || b.bookingId || b.pnr)) {
        <div class="booking-card">
          <div class="booking-header">
            <div>
              <span class="pnr">PNR: {{ b.pnr }}</span>
              <h3>{{ b.trainName || 'Express Train' }} {{ b.trainNumber ? '(' + b.trainNumber + ')' : '' }}</h3>
            </div>
            <div class="badges">
              <span class="badge" [class]="'badge-' + (b.bookingStatus || 'CONFIRMED').toLowerCase()">
                {{ b.bookingStatus || 'CONFIRMED' }}
              </span>
              <span class="badge" [class]="'badge-pay-' + (b.paymentStatus || 'NOT_PAID').toLowerCase()">
                {{ b.paymentStatus || 'NOT_PAID' }}
              </span>
            </div>
          </div>
          <div class="booking-details">
            <div class="detail">
              <label>From</label>
              <span>{{ b.sourceStation?.name || 'Origin Station' }}</span>
            </div>
            <div class="detail">
              <label>To</label>
              <span>{{ b.destinationStation?.name || 'Destination Station' }}</span>
            </div>
            <div class="detail">
              <label>Date</label>
              <span>{{ b.journeyDate }}</span>
            </div>
            <div class="detail">
              <label>Fare</label>
              <span class="fare">₹{{ b.totalFare }}</span>
            </div>
          </div>
          <div class="passengers">
            <label>Passengers:</label>
            @for (p of b.passengers; track (p.seatNumber || p.name || $index)) {
              <span class="passenger-chip">{{ p.name }} · {{ p.coachType || 'Coach' }} · Seat {{ p.seatNumber }}</span>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .page-header h2 { color:#1a237e; font-size:1.8rem; }
    .btn-new { background:#ff6f00; color:white; padding:0.6rem 1.25rem; border-radius:6px; text-decoration:none; font-weight:600; }
    .loading { text-align:center; padding:2rem; color:#555; }
    .alert-error { background:#ffebee; color:#c62828; padding:1rem; border-radius:6px; }
    .empty-state { background:white; border-radius:10px; padding:3rem; text-align:center; color:#555; }
    .link { color:#ff6f00; font-weight:600; text-decoration:none; display:block; margin-top:0.5rem; }
    .bookings-list { display:flex; flex-direction:column; gap:1rem; }
    .booking-card { background:white; border-radius:10px; padding:1.5rem; box-shadow:0 2px 10px rgba(0,0,0,0.08); border-left:4px solid #1a237e; }
    .booking-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; }
    .pnr { font-size:0.78rem; color:#888; font-weight:600; letter-spacing:1px; display:block; }
    .booking-header h3 { margin:0.25rem 0 0; color:#1a237e; }
    .badges { display:flex; gap:0.5rem; flex-wrap:wrap; }
    .badge { padding:0.3rem 0.7rem; border-radius:20px; font-size:0.78rem; font-weight:600; }
    .badge-confirmed { background:#e8f5e9; color:#2e7d32; }
    .badge-pending { background:#fff8e1; color:#f57f17; }
    .badge-cancelled { background:#ffebee; color:#c62828; }
    .badge-pay-paid { background:#e8f5e9; color:#2e7d32; }
    .badge-pay-not_paid, .badge-pay-pending { background:#fff8e1; color:#f57f17; }
    .badge-pay-failed { background:#ffebee; color:#c62828; }
    .booking-details { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px,1fr)); gap:1rem; margin-bottom:1rem; }
    .detail { display:flex; flex-direction:column; }
    .detail label { font-size:0.75rem; color:#888; text-transform:uppercase; }
    .detail span { font-weight:600; color:#333; }
    .fare { color:#1a237e; font-size:1.1rem; }
    .passengers { display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center; }
    .passengers label { font-size:0.8rem; color:#888; }
    .passenger-chip { background:#e8eaf6; color:#1a237e; padding:0.25rem 0.65rem; border-radius:20px; font-size:0.8rem; }
  `]
})
export class BookingsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);

  bookings = signal<BookingResponse[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    const user = this.authService.currentUser();
    const list = this.bookingService.getUserBookings(user?.id);
    this.bookings.set(list);
    this.loading.set(false);
  }
}
