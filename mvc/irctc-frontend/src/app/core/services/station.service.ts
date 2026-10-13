import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Station } from '../models/train.model';
import { PagedResponse } from '../models/booking.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StationService {
  constructor(private http: HttpClient) {}

  // Accessible by ROLE_NORMAL and ROLE_ADMIN
  getStations(page = 0, size = 100): Observable<PagedResponse<Station>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<Station>>(`${environment.apiUrl}/admin/stations`, { params });
  }

  // ADMIN only
  createStation(station: Partial<Station>): Observable<Station> {
    return this.http.post<Station>(`${environment.apiUrl}/admin/stations`, station);
  }

  updateStation(id: number, station: Partial<Station>): Observable<Station> {
    return this.http.put<Station>(`${environment.apiUrl}/admin/stations/${id}`, station);
  }

  deleteStation(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/stations/${id}`);
  }
}
