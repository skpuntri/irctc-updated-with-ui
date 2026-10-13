import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingRequest, BookingResponse, FeedbackRequest, FeedbackResponse, PagedResponse } from '../models/booking.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BookingService {
  constructor(private http: HttpClient) {}

  createBooking(req: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${environment.apiUrl}/user/bookings`, req);
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
