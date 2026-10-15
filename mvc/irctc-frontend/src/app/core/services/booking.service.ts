import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingRequest, BookingResponse, FeedbackRequest, FeedbackResponse, PagedResponse } from '../models/booking.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BookingService {
  constructor(private http: HttpClient) {
    this.initGlobalBookingsStore();
  }

  /** On startup: ensure the global store has at least the known confirmed bookings */
  private initGlobalBookingsStore(): void {
    try {
      const allStr = localStorage.getItem('irctc_all_user_bookings');
      const existing: BookingResponse[] = allStr ? JSON.parse(allStr) : [];
      const seedPnrs = [
        '9c8c9516-d4f0-448c-b62a-fc512071475d',
        'dc443c4c-ddc0-442b-b139-0e8c0589960f'
      ];
      // Add seed bookings that are not already in the global store
      const seedBookings: BookingResponse[] = [
        {
          id: 4, bookingId: 4,
          pnr: '9c8c9516-d4f0-448c-b62a-fc512071475d',
          trainName: 'Kamayani Express', trainNumber: '11071',
          sourceStation: { id: 1, code: 'BSB', name: 'Varanasi', city: 'VARANASI', state: 'UTTAR PRADESH' },
          destinationStation: { id: 3, code: 'LTT', name: 'Mumbai', city: 'Mumbai', state: 'Maharastra' },
          journeyDate: '2026-10-13', departureTime: '15:44:00', arrivalTime: '15:43:00',
          totalFare: 600, bookingStatus: 'CONFIRMED', paymentStatus: 'NOT_PAID',
          passengers: [{ id: 4, name: 'Shailesh', age: 27, gender: 'MALE', coachType: 'SLEEPER', seatNumber: '1' }]
        },
        {
          id: 3, bookingId: 3,
          pnr: 'dc443c4c-ddc0-442b-b139-0e8c0589960f',
          trainName: 'Kamayani Express', trainNumber: '11071',
          sourceStation: { id: 1, code: 'BSB', name: 'Varanasi', city: 'VARANASI', state: 'UTTAR PRADESH' },
          destinationStation: { id: 3, code: 'LTT', name: 'Mumbai', city: 'Mumbai', state: 'Maharastra' },
          journeyDate: '2026-10-13', departureTime: '15:44:00', arrivalTime: '15:43:00',
          totalFare: 1200, bookingStatus: 'CONFIRMED', paymentStatus: 'NOT_PAID',
          passengers: [{ id: 3, name: 'Shailesh', age: 30, gender: 'MALE', coachType: 'AC', seatNumber: '2' }]
        }
      ];
      const existingPnrs = new Set(existing.map(b => b.pnr));
      const merged = [...existing];
      seedBookings.forEach(s => { if (!existingPnrs.has(s.pnr)) merged.push(s); });
      localStorage.setItem('irctc_all_user_bookings', JSON.stringify(merged));
    } catch {}
  }

  createBooking(req: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${environment.apiUrl}/user/bookings`, req);
  }

  saveBookingLocally(booking: BookingResponse, userId?: number): void {
    try {
      // 1. Save to per-user key
      const userKey = userId ? `irctc_bookings_${userId}` : 'irctc_user_bookings';
      const userStr = localStorage.getItem(userKey);
      const userList: BookingResponse[] = userStr ? JSON.parse(userStr) : [];
      const userFiltered = userList.filter(b => b.pnr !== booking.pnr && (b.id !== booking.id || b.bookingId !== booking.bookingId));
      userFiltered.unshift(booking);
      localStorage.setItem(userKey, JSON.stringify(userFiltered));

      // 2. Merge into the global all-users store (accumulate, do NOT overwrite)
      const allStr = localStorage.getItem('irctc_all_user_bookings');
      const allList: BookingResponse[] = allStr ? JSON.parse(allStr) : [];
      const allFiltered = allList.filter(b => b.pnr !== booking.pnr && (b.id !== booking.id || b.bookingId !== booking.bookingId));
      allFiltered.unshift(booking);
      localStorage.setItem('irctc_all_user_bookings', JSON.stringify(allFiltered));
    } catch (e) {
      console.error('Error saving booking locally', e);
    }
  }

  getUserBookings(userId?: number): BookingResponse[] {
    try {
      if (userId) {
        const key = `irctc_bookings_${userId}`;
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
      const generic = localStorage.getItem('irctc_user_bookings');
      if (generic) {
        const parsed = JSON.parse(generic);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    // Fallback seed with confirmed reservations
    return [
      {
        id: 4,
        bookingId: 4,
        pnr: '9c8c9516-d4f0-448c-b62a-fc512071475d',
        trainName: 'Kamayani Express',
        trainNumber: '11071',
        sourceStation: { id: 1, code: 'BSB', name: 'Varanasi', city: 'VARANASI', state: 'UTTAR PRADESH' },
        destinationStation: { id: 3, code: 'LTT', name: 'Mumbai', city: 'Mumbai', state: 'Maharastra' },
        journeyDate: '2026-10-13',
        departureTime: '15:44:00',
        arrivalTime: '15:43:00',
        totalFare: 600,
        bookingStatus: 'CONFIRMED',
        paymentStatus: 'NOT_PAID',
        passengers: [
          { id: 4, name: 'Shailesh', age: 27, gender: 'MALE', coachType: 'SLEEPER', seatNumber: '1' }
        ]
      },
      {
        id: 3,
        bookingId: 3,
        pnr: 'dc443c4c-ddc0-442b-b139-0e8c0589960f',
        trainName: 'Kamayani Express',
        trainNumber: '11071',
        sourceStation: { id: 1, code: 'BSB', name: 'Varanasi', city: 'VARANASI', state: 'UTTAR PRADESH' },
        destinationStation: { id: 3, code: 'LTT', name: 'Mumbai', city: 'Mumbai', state: 'Maharastra' },
        journeyDate: '2026-10-13',
        departureTime: '15:44:00',
        arrivalTime: '15:43:00',
        totalFare: 1200,
        bookingStatus: 'CONFIRMED',
        paymentStatus: 'NOT_PAID',
        passengers: [
          { id: 3, name: 'Shailesh', age: 30, gender: 'MALE', coachType: 'AC', seatNumber: '2' }
        ]
      }
    ];
  }

  /** Returns ALL bookings across every user (admin dashboard use) */
  getAllBookings(): BookingResponse[] {
    try {
      const allStr = localStorage.getItem('irctc_all_user_bookings');
      if (allStr) {
        const parsed = JSON.parse(allStr);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // Fallback: collect from all per-user keys in localStorage
    const all: BookingResponse[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('irctc_bookings_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed: BookingResponse[] = JSON.parse(data);
            parsed.forEach(b => {
              if (b.pnr && !seen.has(b.pnr)) {
                seen.add(b.pnr);
                all.push(b);
              }
            });
          }
        } catch {}
      }
    }
    return all.length > 0 ? all : this.getUserBookings();
  }

  /** Total booking count across all users (for admin dashboard) */
  getBookingCount(): number {
    return this.getAllBookings().length;
  }

  /** Total revenue across all users (for admin dashboard) */
  getTotalRevenue(): number {
    return this.getAllBookings().reduce((sum, b) => sum + (b.totalFare || 0), 0);
  }
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  constructor(private http: HttpClient) {}

  submitFeedback(req: FeedbackRequest): Observable<FeedbackResponse> {
    return this.http.post<FeedbackResponse>(`${environment.apiUrl}/api/feedback`, req);
  }

  getAllFeedbacks(page = 0, size = 10): Observable<PagedResponse<FeedbackResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<FeedbackResponse>>(`${environment.apiUrl}/api/feedback`, { params });
  }

  getMyFeedbacks(userId: number, page = 0, size = 10): Observable<PagedResponse<FeedbackResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<FeedbackResponse>>(`${environment.apiUrl}/api/feedback/user/${userId}`, { params });
  }
}
