import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { TrainService } from '../../../core/services/train.service';
import { StationService } from '../../../core/services/station.service';
import { AuthService } from '../../../core/services/auth.service';
import { BookingRequest, BookingResponse } from '../../../core/models/booking.model';
import { CoachType, Station, AvailableTrainResponse, UserTrainSearchRequest } from '../../../core/models/train.model';

interface PassengerForm {
  name: string;
  age: number | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

const DEFAULT_STATIONS: Station[] = [
  { id: 1, code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi', state: 'Uttar Pradesh' },
  { id: 2, code: 'SAW', name: 'Suriawan', city: 'Suriawan', state: 'Uttar Pradesh' },
  { id: 3, code: 'LTT', name: 'Lokmanya Tilak Terminus (Mumbai)', city: 'Mumbai', state: 'Maharashtra' },
  { id: 203, code: 'NDLS', name: 'New Delhi', city: 'New Delhi', state: 'Delhi' },
  { id: 210, code: 'BCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra' },
  { id: 241, code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal' },
  { id: 219, code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', state: 'Uttar Pradesh' },
  { id: 217, code: 'PRYJ', name: 'Prayagraj Junction', city: 'Prayagraj', state: 'Uttar Pradesh' },
  { id: 218, code: 'LKO', name: 'Lucknow Charbagh', city: 'Lucknow', state: 'Uttar Pradesh' },
  { id: 291, code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat' },
  { id: 281, code: 'SBC', name: 'KSR Bengaluru City Junction', city: 'Bengaluru', state: 'Karnataka' },
  { id: 271, code: 'MAS', name: 'Chennai Central', city: 'Chennai', state: 'Tamil Nadu' }
];

@Component({
  selector: 'app-new-booking',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h2>🎫 Book a Ticket</h2>
      <p class="subtitle">Enter passenger details to confirm your ticket reservation</p>
    </div>

    <!-- 1. SUCCESS CONFIRMATION -->
    @if (success()) {
      <div class="success-card">
        <div class="success-header">
          <span class="success-icon">✅</span>
          <div>
            <h3>Booking Confirmed!</h3>
            <p class="pnr-sub">Keep your PNR safe for chart preparation and journey travel</p>
          </div>
        </div>

        <div class="pnr-box">
          <label>YOUR PNR NUMBER</label>
          <span class="pnr">{{ success()!.pnr }}</span>
        </div>

        <div class="details-grid">
          <div><label>Train</label><span>{{ success()!.trainName }} (#{{ success()!.trainNumber }})</span></div>
          <div><label>Journey Date</label><span>📅 {{ success()!.journeyDate }}</span></div>
          <div><label>From</label><span>📍 {{ success()!.sourceStation?.name || 'Source' }}</span></div>
          <div><label>To</label><span>📍 {{ success()!.destinationStation?.name || 'Destination' }}</span></div>
          <div><label>Total Fare</label><span class="fare">₹{{ success()!.totalFare }}</span></div>
          <div><label>Booking Status</label><span class="status-badge">{{ success()!.bookingStatus }}</span></div>
        </div>

        <div class="passengers-section">
          <h4>Passengers & Allocated Seats ({{ success()!.passengers.length }})</h4>
          <div class="passengers-list">
            @for (p of success()!.passengers; track p.seatNumber) {
              <div class="passenger-row">
                <span class="p-name">👤 {{ p.name }} ({{ p.gender }}, {{ p.age }} yrs)</span>
                <span class="p-coach">{{ p.coachType }}</span>
                <span class="p-seat">Seat: <strong>{{ p.seatNumber }}</strong></span>
              </div>
            }
          </div>
        </div>

        <div class="success-actions">
          <a routerLink="/user/bookings" class="btn-primary">📋 View All My Bookings</a>
          <button type="button" (click)="reset()" class="btn-secondary">Book Another Ticket</button>
          <a routerLink="/trains/search" class="btn-primary">🔍 Search All Trains</a>
        </div>
      </div>
    }

    <!-- 2. BOOKING IN PROGRESS -->
    @if (!success()) {
      <div class="booking-layout">
        <!-- SCENARIO A: TRAIN IS SELECTED -->
        @if (req.trainScheduleId > 0) {
          <!-- Journey Summary Banner -->
          <div class="journey-summary-card">
            <div class="summary-top">
              <div class="train-meta">
                <span class="train-badge">🚆 {{ journeyInfo()?.trainNumber || 'Express' }}</span>
                <h3 class="train-name">{{ journeyInfo()?.trainName || 'Selected Train' }}</h3>
              </div>
              <div class="date-chip">
                <span class="chip-lbl">Journey Date</span>
                <span class="chip-val">📅 {{ journeyInfo()?.journeyDate || 'Today' }}</span>
              </div>
            </div>

            <div class="route-strip">
              <div class="route-point">
                <span class="point-lbl">ORIGIN</span>
                <strong class="point-name">📍 {{ journeyInfo()?.sourceName || 'Source Station' }}</strong>
              </div>
              <div class="route-line-box">
                <span class="route-line">──────────────→</span>
              </div>
              <div class="route-point right">
                <span class="point-lbl">DESTINATION</span>
                <strong class="point-name">📍 {{ journeyInfo()?.destName || 'Destination Station' }}</strong>
              </div>
            </div>

            <!-- Coach Selector -->
            <div class="coach-block">
              <label class="block-lbl">Select Coach Class:</label>
              <div class="coach-pills">
                <button
                  type="button"
                  class="coach-pill"
                  [class.active]="req.coachType === 'AC'"
                  (click)="req.coachType = 'AC'"
                >
                  AC Class
                </button>
                <button
                  type="button"
                  class="coach-pill"
                  [class.active]="req.coachType === 'SLEEPER'"
                  (click)="req.coachType = 'SLEEPER'"
                >
                  Sleeper (SL)
                </button>
                <button
                  type="button"
                  class="coach-pill"
                  [class.active]="req.coachType === 'GENERAL'"
                  (click)="req.coachType = 'GENERAL'"
                >
                  General (2S)
                </button>
              </div>
            </div>

            <div class="change-train-bar">
              <span>Want to choose another train or route?</span>
              <button type="button" (click)="clearSelectedTrain()" class="btn-change">
                🔄 Change Train
              </button>
            </div>
          </div>

          <!-- Passenger Details Form -->
          <div class="passengers-card">
            <form (ngSubmit)="submitBooking()">
              <div class="card-header-row">
                <div class="title-wrap">
                  <h3>Passenger Details</h3>
                  <span class="subtitle-small">Enter names as shown on government ID</span>
                </div>
                <button type="button" (click)="addPassenger()" class="btn-add-p">
                  + Add Passenger
                </button>
              </div>

              <div class="passengers-container">
                @for (p of passengers; track $index; let i = $index) {
                  <div class="passenger-item">
                    <div class="item-header">
                      <span class="p-index">Passenger {{ i + 1 }}</span>
                      @if (passengers.length > 1) {
                        <button type="button" (click)="removePassenger(i)" class="btn-remove-p" title="Remove">
                          ✕ Remove
                        </button>
                      }
                    </div>

                    <div class="item-fields">
                      <div class="field-group flex-2">
                        <label>Full Name *</label>
                        <input
                          [(ngModel)]="p.name"
                          [name]="'name_' + i"
                          placeholder="e.g. Ramesh Kumar"
                          required
                          class="form-control"
                        />
                      </div>

                      <div class="field-group flex-1">
                        <label>Age *</label>
                        <input
                          [(ngModel)]="p.age"
                          [name]="'age_' + i"
                          type="number"
                          placeholder="Age"
                          min="1"
                          max="120"
                          required
                          class="form-control"
                        />
                      </div>

                      <div class="field-group flex-1">
                        <label>Gender *</label>
                        <select [(ngModel)]="p.gender" [name]="'gender_' + i" class="form-control">
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                }
              </div>

              @if (error()) {
                <div class="alert alert-error">{{ error() }}</div>
              }

              <div class="form-bottom">
                <button type="submit" class="btn-confirm" [disabled]="loading()">
                  {{ loading() ? 'Confirming Reservation...' : '🎫 Confirm & Reserve Ticket' }}
                </button>
              </div>
            </form>
          </div>
        }

        <!-- SCENARIO B: NO TRAIN SELECTED YET -->
        @if (req.trainScheduleId === 0) {
          <div class="select-train-card">
            <div class="guide-banner">
              <span class="guide-icon">🔍</span>
              <div>
                <h3>Find and Select a Train</h3>
                <p>Choose your departure station, destination, and travel date to pick a train:</p>
              </div>
            </div>

            <form (ngSubmit)="findTrains()" class="quick-search-form">
              <div class="form-row">
                <div class="form-group autocomplete-container">
                  <label>From Station</label>
                  <input
                    [ngModel]="fromInput()"
                    (ngModelChange)="onFromChange($event)"
                    name="qFrom"
                    (focus)="fromFocused.set(true)"
                    (blur)="onBlur('from')"
                    placeholder="e.g. NDLS or New Delhi"
                    required
                    class="form-control"
                    autocomplete="off"
                  />
                  @if (fromFocused() && fromSuggestions().length > 0) {
                    <ul class="dropdown-menu">
                      @for (s of fromSuggestions(); track s.id) {
                        <li class="dropdown-item" (mousedown)="$event.preventDefault(); selectFrom(s)">
                          <div class="station-meta">
                            <strong>{{ s.name }}</strong>
                            <span class="badge-code">{{ s.code }}</span>
                          </div>
                          @if (s.city || s.state) {
                            <small class="station-sub">{{ s.city }}{{ s.city && s.state ? ', ' : '' }}{{ s.state }}</small>
                          }
                        </li>
                      }
                    </ul>
                  }
                </div>

                <button type="button" class="btn-swap-mini" (click)="swapStations()" title="Swap stations">⇄</button>

                <div class="form-group autocomplete-container">
                  <label>To Station</label>
                  <input
                    [ngModel]="toInput()"
                    (ngModelChange)="onToChange($event)"
                    name="qTo"
                    (focus)="toFocused.set(true)"
                    (blur)="onBlur('to')"
                    placeholder="e.g. BCT or Mumbai Central"
                    required
                    class="form-control"
                    autocomplete="off"
                  />
                  @if (toFocused() && toSuggestions().length > 0) {
                    <ul class="dropdown-menu">
                      @for (s of toSuggestions(); track s.id) {
                        <li class="dropdown-item" (mousedown)="$event.preventDefault(); selectTo(s)">
                          <div class="station-meta">
                            <strong>{{ s.name }}</strong>
                            <span class="badge-code">{{ s.code }}</span>
                          </div>
                          @if (s.city || s.state) {
                            <small class="station-sub">{{ s.city }}{{ s.city && s.state ? ', ' : '' }}{{ s.state }}</small>
                          }
                        </li>
                      }
                    </ul>
                  }
                </div>

                <div class="form-group date-col">
                  <label>Journey Date</label>
                  <input
                    [(ngModel)]="searchDate"
                    name="qDate"
                    type="date"
                    required
                    class="form-control"
                    [min]="today"
                  />
                </div>

                <button type="submit" class="btn-search-now" [disabled]="searchLoading()">
                  {{ searchLoading() ? 'Searching...' : '🔍 Find Trains' }}
                </button>
              </div>
            </form>

            @if (searchError()) {
              <div class="alert alert-error">{{ searchError() }}</div>
            }

            @if (searchResults().length > 0) {
              <div class="search-results-list">
                <h4>{{ searchResults().length }} train(s) available on {{ searchDate }}:</h4>
                @for (tr of searchResults(); track tr.trainId) {
                  <div class="train-choice-card">
                    <div class="choice-info">
                      <div class="choice-name">
                        <strong>{{ tr.trainName }}</strong> (#{{ tr.trainNumber }})
                      </div>
                      <div class="choice-times">
                        Dep: {{ tr.departureTime || '--:--' }} → Arr: {{ tr.arrivalTime || '--:--' }}
                      </div>
                    </div>
                    <button type="button" class="btn-select-train" (click)="selectTrainForBooking(tr)">
                      Select This Train →
                    </button>
                  </div>
                }
              </div>
            }

            @if (searchedOnce() && searchResults().length === 0 && !searchLoading()) {
              <div class="empty-choice">
                <p>No scheduled trains found on this route for {{ searchDate }}.</p>
                <a routerLink="/trains/search" class="btn-link">Browse Full Train Search</a>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .page-header h2 { font-size: 1.8rem; color: #1a237e; margin: 0; }
    .subtitle { color: #555; margin-top: 0.3rem; font-size: 0.95rem; }

    /* Journey Summary Card */
    .journey-summary-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.07);
      margin-bottom: 1.5rem;
      border-left: 5px solid #1a237e;
    }
    .summary-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .train-meta { display: flex; align-items: center; gap: 0.75rem; }
    .train-badge {
      background: #e8eaf6;
      color: #1a237e;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .train-name { margin: 0; color: #1a237e; font-size: 1.35rem; }
    .date-chip {
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 0.35rem 0.75rem;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .chip-lbl { font-size: 0.7rem; color: #888; text-transform: uppercase; }
    .chip-val { font-size: 0.95rem; font-weight: 700; color: #222; }

    .route-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8f9ff;
      border-radius: 8px;
      padding: 0.9rem 1.25rem;
      margin-bottom: 1.25rem;
    }
    .route-point { display: flex; flex-direction: column; }
    .route-point.right { align-items: flex-end; }
    .point-lbl { font-size: 0.7rem; color: #888; font-weight: 600; }
    .point-name { font-size: 1rem; color: #1a237e; }
    .route-line-box { color: #9fa8da; letter-spacing: 2px; }

    .coach-block { margin-bottom: 1rem; }
    .block-lbl { font-size: 0.85rem; font-weight: 600; color: #444; margin-bottom: 0.5rem; display: block; }
    .coach-pills { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .coach-pill {
      background: #f0f2f5;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      padding: 0.5rem 1.25rem;
      font-weight: 600;
      color: #333;
      cursor: pointer;
      transition: all 0.2s;
    }
    .coach-pill.active {
      background: #1a237e;
      color: white;
      border-color: #1a237e;
      box-shadow: 0 2px 8px rgba(26,35,126,0.25);
    }

    .change-train-bar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.85rem;
      color: #777;
      padding-top: 0.75rem;
      border-top: 1px dashed #eee;
    }
    .btn-change {
      background: none;
      border: 1px solid #1a237e;
      color: #1a237e;
      border-radius: 6px;
      padding: 0.25rem 0.65rem;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-change:hover { background: #e8eaf6; }

    /* Passenger Card */
    .passengers-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    }
    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f0f0f0;
    }
    .title-wrap h3 { margin: 0; color: #1a237e; font-size: 1.2rem; }
    .subtitle-small { font-size: 0.8rem; color: #777; }
    .btn-add-p {
      background: #e8eaf6;
      color: #1a237e;
      border: none;
      padding: 0.45rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .btn-add-p:hover { background: #c5cae9; }

    .passengers-container { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.5rem; }
    .passenger-item {
      background: #fafbfe;
      border: 1px solid #e8eaf6;
      border-radius: 8px;
      padding: 1rem;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.6rem;
    }
    .p-index { font-weight: 700; font-size: 0.85rem; color: #1a237e; }
    .btn-remove-p {
      background: none;
      border: none;
      color: #c62828;
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 600;
    }
    .item-fields { display: flex; gap: 0.85rem; flex-wrap: wrap; }
    .field-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .field-group.flex-2 { flex: 2; min-width: 180px; }
    .field-group.flex-1 { flex: 1; min-width: 110px; }
    .field-group label { font-size: 0.78rem; font-weight: 600; color: #555; }
    .form-control {
      padding: 0.6rem 0.85rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.95rem;
      outline: none;
      background: white;
    }
    .form-control:focus { border-color: #1a237e; }

    .form-bottom { display: flex; justify-content: flex-end; margin-top: 1.5rem; }
    .btn-confirm {
      padding: 0.85rem 2.5rem;
      background: #ff6f00;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(255,111,0,0.3);
      transition: background 0.2s;
    }
    .btn-confirm:hover:not(:disabled) { background: #e65100; }
    .btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Scenario B: Direct Select Form */
    .select-train-card {
      background: white;
      border-radius: 12px;
      padding: 1.75rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    .guide-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f0f0f0;
    }
    .guide-icon { font-size: 2rem; }
    .guide-banner h3 { margin: 0; color: #1a237e; font-size: 1.25rem; }
    .guide-banner p { margin: 0.25rem 0 0 0; color: #666; font-size: 0.9rem; }
    .quick-search-form .form-row {
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    .autocomplete-container { position: relative; flex: 1; min-width: 170px; }
    .autocomplete-container label, .date-col label { font-size: 0.82rem; font-weight: 600; color: #444; margin-bottom: 0.35rem; display: block; }
    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.12);
      border: 1px solid #eee;
      margin: 4px 0 0 0;
      padding: 0.3rem 0;
      list-style: none;
      z-index: 1000;
      max-height: 220px;
      overflow-y: auto;
    }
    .dropdown-item {
      padding: 0.5rem 0.85rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.2rem;
      font-size: 0.88rem;
      border-bottom: 1px solid #f8f9fa;
    }
    .dropdown-item:hover { background: #f0f4ff; }
    .station-meta {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .station-sub {
      color: #777;
      font-size: 0.75rem;
    }
    .badge-code { background: #e8eaf6; color: #1a237e; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
    .btn-swap-mini {
      height: 38px;
      width: 38px;
      border-radius: 50%;
      border: 1px solid #ddd;
      background: #f8f9fa;
      cursor: pointer;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2px;
      flex-shrink: 0;
    }
    .date-col { max-width: 180px; }
    .btn-search-now {
      padding: 0.65rem 1.4rem;
      background: #1a237e;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }

    .search-results-list { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .search-results-list h4 { color: #1a237e; margin: 0 0 0.5rem 0; }
    .train-choice-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.9rem 1.25rem;
      background: #f8f9ff;
      border-radius: 8px;
      border: 1px solid #e8eaf6;
    }
    .choice-name { font-size: 1.05rem; color: #1a237e; }
    .choice-times { font-size: 0.85rem; color: #555; margin-top: 0.2rem; }
    .btn-select-train {
      background: #ff6f00;
      color: white;
      border: none;
      padding: 0.5rem 1.2rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-select-train:hover { background: #e65100; }
    .empty-choice { text-align: center; padding: 2rem; color: #777; }
    .btn-link { color: #1a237e; font-weight: 600; }

    /* Success Card */
    .success-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      border-top: 5px solid #2e7d32;
    }
    .success-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .success-icon { font-size: 2.2rem; }
    .success-header h3 { margin: 0; color: #2e7d32; font-size: 1.5rem; }
    .pnr-sub { margin: 0.2rem 0 0 0; color: #666; font-size: 0.85rem; }
    .pnr-box {
      background: #e8f5e9;
      border: 1px solid #c8e6c9;
      border-radius: 8px;
      padding: 1.25rem;
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .pnr-box label { font-size: 0.75rem; color: #2e7d32; font-weight: 700; letter-spacing: 1px; display: block; margin-bottom: 0.25rem; }
    .pnr { font-size: 2.2rem; font-weight: 800; color: #1a237e; letter-spacing: 4px; font-family: monospace; }
    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1.25rem;
      background: #fafafa;
      padding: 1.25rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }
    .details-grid div { display: flex; flex-direction: column; gap: 0.2rem; }
    .details-grid label { font-size: 0.75rem; color: #777; font-weight: 600; }
    .details-grid span { font-weight: 700; color: #333; font-size: 0.95rem; }
    .fare { color: #1a237e !important; font-size: 1.2rem !important; }
    .status-badge { color: #2e7d32 !important; font-weight: 800; }
    .passengers-section { margin-bottom: 1.5rem; }
    .passengers-section h4 { color: #1a237e; margin: 0 0 0.75rem 0; }
    .passengers-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .passenger-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 1rem;
      background: #f8f9ff;
      border-radius: 6px;
      border-left: 3px solid #1a237e;
    }
    .p-coach { background: #e8eaf6; color: #1a237e; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; font-size: 0.8rem; }
    .p-seat { color: #2e7d32; }
    .success-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }
    .btn-primary { background: #1a237e; color: white; padding: 0.75rem 1.6rem; border-radius: 6px; text-decoration: none; font-weight: 600; }
    .btn-secondary { background: #f0f2f5; color: #333; border: 1px solid #ccc; padding: 0.75rem 1.6rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .alert { padding: 1rem; border-radius: 6px; margin: 1rem 0; }
    .alert-error { background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; }
  `]
})
export class NewBookingComponent implements OnInit {
  private bookingService = inject(BookingService);
  private trainService = inject(TrainService);
  private stationService = inject(StationService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  today = new Date().toISOString().split('T')[0];

  req: BookingRequest = {
    userId: 0,
    trainScheduleId: 0,
    trainId: 0,
    sourceStationId: 0,
    destinationStationId: 0,
    journeyDate: '',
    coachType: 'AC' as CoachType,
    passengers: []
  };

  journeyInfo = signal<{
    trainId?: number;
    trainName?: string;
    trainNumber?: string;
    sourceName?: string;
    destName?: string;
    journeyDate?: string;
  } | null>(null);

  passengers: PassengerForm[] = [{ name: '', age: null, gender: 'MALE' }];
  loading = signal(false);
  error = signal('');
  success = signal<BookingResponse | null>(null);

  // Quick search when opening page directly
  stations = signal<Station[]>(DEFAULT_STATIONS);
  fromInput = signal('');
  toInput = signal('');
  selectedFromStation = signal<Station | null>(null);
  selectedToStation = signal<Station | null>(null);
  searchDate = this.today;
  fromFocused = signal(false);
  toFocused = signal(false);
  searchLoading = signal(false);
  searchError = signal('');
  searchResults = signal<AvailableTrainResponse[]>([]);
  searchedOnce = signal(false);

  fromSuggestions = computed(() => this.filterStations(this.fromInput()));
  toSuggestions = computed(() => this.filterStations(this.toInput()));

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) this.req.userId = user.id;

    // Load stations from cache / backend
    try {
      const cached = localStorage.getItem('irctc_stations');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) this.stations.set(parsed);
      }
    } catch {}

    if (this.authService.isLoggedIn()) {
      this.stationService.getStations(0, 500).subscribe({
        next: res => {
          if (res.content?.length) {
            this.stations.set(res.content);
            try {
              localStorage.setItem('irctc_stations', JSON.stringify(res.content));
            } catch {}
          }
        },
        error: () => {}
      });
    }

    // Read query params from URL (when navigated from Search Trains)
    this.route.queryParams.subscribe(params => {
      if (params['trainScheduleId']) {
        this.req.trainScheduleId = Number(params['trainScheduleId']);
        this.req.trainId = Number(params['trainId']) || 0;
        this.req.sourceStationId = Number(params['sourceStationId']);
        this.req.destinationStationId = Number(params['destinationStationId']);
        this.req.journeyDate = params['journeyDate'] || this.today;
        if (params['coachType']) {
          this.req.coachType = params['coachType'] as CoachType;
        }

        this.journeyInfo.set({
          trainId: this.req.trainId,
          trainName: params['trainName'] || 'Express Train',
          trainNumber: params['trainNumber'] || '',
          sourceName: params['sourceName'] || this.getStationDisplayName(this.req.sourceStationId),
          destName: params['destName'] || this.getStationDisplayName(this.req.destinationStationId),
          journeyDate: this.req.journeyDate
        });
      }
    });
  }

  private getStationDisplayName(id: number): string {
    const found = this.stations().find(s => s.id === id);
    return found ? `${found.name} (${found.code})` : `Station #${id}`;
  }

  private filterStations(query: string): Station[] {
    const q = (query || '').trim().toUpperCase();
    const all = this.stations();
    if (!q) {
      return [...all].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8);
    }
    return all
      .filter(s =>
        s.code?.toUpperCase().includes(q) ||
        s.name?.toUpperCase().includes(q) ||
        s.city?.toUpperCase().includes(q)
      )
      .slice(0, 8);
  }

  onFromChange(val: string): void {
    this.fromInput.set(val);
    this.fromFocused.set(true);
    const matched = this.resolveStation(val);
    this.selectedFromStation.set(matched);
  }

  onToChange(val: string): void {
    this.toInput.set(val);
    this.toFocused.set(true);
    const matched = this.resolveStation(val);
    this.selectedToStation.set(matched);
  }

  selectFrom(s: Station): void {
    this.selectedFromStation.set(s);
    this.fromInput.set(`${s.name} (${s.code})`);
    this.fromFocused.set(false);
  }

  selectTo(s: Station): void {
    this.selectedToStation.set(s);
    this.toInput.set(`${s.name} (${s.code})`);
    this.toFocused.set(false);
  }

  onBlur(type: 'from' | 'to'): void {
    setTimeout(() => {
      if (type === 'from') this.fromFocused.set(false);
      else this.toFocused.set(false);
    }, 200);
  }

  swapStations(): void {
    const tempInput = this.fromInput();
    const tempStation = this.selectedFromStation();
    this.fromInput.set(this.toInput());
    this.selectedFromStation.set(this.selectedToStation());
    this.toInput.set(tempInput);
    this.selectedToStation.set(tempStation);
  }

  private resolveStation(input: string): Station | null {
    if (!input) return null;
    const trimmed = input.trim().toUpperCase();
    const all = this.stations();

    const match = trimmed.match(/\(([A-Z0-9]+)\)/);
    if (match) {
      const found = all.find(s => s.code?.toUpperCase() === match[1]);
      if (found) return found;
    }

    const byCode = all.find(s => s.code?.toUpperCase() === trimmed);
    if (byCode) return byCode;

    const byName = all.find(s => s.name?.toUpperCase() === trimmed);
    if (byName) return byName;

    return all.find(s =>
      s.code?.toUpperCase().includes(trimmed) ||
      s.name?.toUpperCase().includes(trimmed) ||
      s.city?.toUpperCase().includes(trimmed)
    ) || null;
  }

  findTrains(): void {
    this.searchLoading.set(true);
    this.searchError.set('');
    this.searchedOnce.set(true);

    const src = this.selectedFromStation() || this.resolveStation(this.fromInput());
    const dst = this.selectedToStation() || this.resolveStation(this.toInput());

    if (!src || !dst) {
      this.searchError.set('Please select valid From and To stations from the suggestions list.');
      this.searchLoading.set(false);
      return;
    }

    const payload: UserTrainSearchRequest = {
      sourceStationId: src.id,
      destinationStationId: dst.id,
      journeyDate: this.searchDate
    };

    this.trainService.searchTrains(payload).subscribe({
      next: res => {
        this.searchResults.set(res || []);
        this.searchLoading.set(false);
      },
      error: err => {
        this.searchError.set(err.error?.message || 'Search failed. Please try again.');
        this.searchLoading.set(false);
      }
    });
  }

  selectTrainForBooking(train: AvailableTrainResponse): void {
    this.req.trainScheduleId = train.trainScheduleId || 0;
    this.req.trainId = train.trainId || 0;
    this.req.journeyDate = (train.scheduleDate as any) || this.searchDate;

    const src = this.selectedFromStation() || this.resolveStation(this.fromInput());
    const dst = this.selectedToStation() || this.resolveStation(this.toInput());

    if (src) this.req.sourceStationId = src.id;
    if (dst) this.req.destinationStationId = dst.id;

    this.journeyInfo.set({
      trainId: this.req.trainId,
      trainName: train.trainName,
      trainNumber: train.trainNumber,
      sourceName: src ? `${src.name} (${src.code})` : 'Source',
      destName: dst ? `${dst.name} (${dst.code})` : 'Destination',
      journeyDate: this.req.journeyDate
    });
  }

  clearSelectedTrain(): void {
    this.req.trainScheduleId = 0;
    this.journeyInfo.set(null);
  }

  addPassenger(): void {
    this.passengers.push({ name: '', age: null, gender: 'MALE' });
  }

  removePassenger(index: number): void {
    this.passengers.splice(index, 1);
  }

  submitBooking(): void {
    this.error.set('');

    // Validation
    if (!this.req.trainScheduleId) {
      this.error.set('No train schedule selected. Please select a train first.');
      return;
    }

    for (let i = 0; i < this.passengers.length; i++) {
      const p = this.passengers[i];
      if (!p.name || !p.name.trim()) {
        this.error.set(`Please enter Full Name for Passenger ${i + 1}.`);
        return;
      }
      if (!p.age || p.age < 1 || p.age > 120) {
        this.error.set(`Please enter a valid age (1-120) for Passenger ${i + 1}.`);
        return;
      }
    }

    this.loading.set(true);

    const currentUser = this.authService.currentUser();
    const effectiveUserId = currentUser?.id || this.req.userId || 1;

    const payload: BookingRequest = {
      userId: Number(effectiveUserId),
      trainScheduleId: Number(this.req.trainScheduleId),
      sourceStationId: Number(this.req.sourceStationId),
      destinationStationId: Number(this.req.destinationStationId),
      trainId: Number(this.req.trainId) || undefined,
      journeyDate: this.req.journeyDate || this.journeyInfo()?.journeyDate || this.today,
      coachType: this.req.coachType,
      passengers: this.passengers.map(p => ({
        name: p.name.trim(),
        age: Number(p.age),
        gender: p.gender
      }))
    };

    this.bookingService.createBooking(payload).subscribe({
      next: res => {
        const enriched: BookingResponse = {
          ...res,
          id: res.id ?? res.bookingId,
          bookingId: res.bookingId ?? res.id,
          trainName: this.journeyInfo()?.trainName || 'Express Train',
          trainNumber: this.journeyInfo()?.trainNumber || '',
          sourceStation: res.sourceStation || { id: payload.sourceStationId, name: this.journeyInfo()?.sourceName || 'Origin', code: '', city: '', state: '' },
          destinationStation: res.destinationStation || { id: payload.destinationStationId, name: this.journeyInfo()?.destName || 'Destination', code: '', city: '', state: '' },
          passengers: (res.passengers ?? []).map((p: any) => ({
            ...p,
            coachType: p.coachType || this.req.coachType,
            coachId: p.coachId || p.trainSeat?.id
          }))
        };

        this.bookingService.saveBookingLocally(enriched, payload.userId);
        this.success.set(enriched);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message || 'Booking reservation failed. Please check seat availability.');
        this.loading.set(false);
      }
    });
  }

  reset(): void {
    this.success.set(null);
    this.req.trainScheduleId = 0;
    this.req.trainId = 0;
    this.req.sourceStationId = 0;
    this.req.destinationStationId = 0;
    this.journeyInfo.set(null);
    this.passengers = [{ name: '', age: null, gender: 'MALE' }];
    this.fromInput.set('');
    this.toInput.set('');
    this.selectedFromStation.set(null);
    this.selectedToStation.set(null);
    this.searchResults.set([]);
    this.searchedOnce.set(false);
    this.error.set('');
    this.searchError.set('');
    this.fromFocused.set(false);
    this.toFocused.set(false);

    // Cleanly clear URL query parameters so stale route data from previous booking does not reload
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }
}
