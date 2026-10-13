import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AvailableTrainResponse, UserTrainSearchRequest, Train, TrainRoute, TrainSchedule, TrainSeat } from '../models/train.model';
import { Station } from '../models/train.model';
import { PagedResponse } from '../models/booking.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TrainService {
  constructor(private http: HttpClient) {}

  // PUBLIC — no auth required
  searchTrains(req: UserTrainSearchRequest): Observable<AvailableTrainResponse[]> {
    return this.http.post<AvailableTrainResponse[]>(`${environment.apiUrl}/user/trains/search`, req);
  }

  // ADMIN
  getAllTrains(): Observable<Train[]> {
    return this.http.get<Train[]>(`${environment.apiUrl}/admin/trains`);
  }

  getTrainById(id: number): Observable<Train> {
    return this.http.get<Train>(`${environment.apiUrl}/admin/trains/${id}`);
  }

  createTrain(train: Partial<Train>): Observable<Train> {
    return this.http.post<Train>(`${environment.apiUrl}/admin/trains`, train);
  }

  updateTrain(id: number, train: Partial<Train>): Observable<Train> {
    return this.http.put<Train>(`${environment.apiUrl}/admin/trains/${id}`, train);
  }

  deleteTrain(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/trains/${id}`);
  }

  getTrainSchedules(trainId: number): Observable<TrainSchedule[]> {
    return this.http.get<TrainSchedule[]>(`${environment.apiUrl}/admin/train-schedules/train/${trainId}`);
  }

  createSchedule(schedule: any): Observable<TrainSchedule> {
    return this.http.post<TrainSchedule>(`${environment.apiUrl}/admin/train-schedules`, schedule);
  }

  updateSchedule(scheduleId: number, schedule: any): Observable<TrainSchedule> {
    return this.http.put<TrainSchedule>(`${environment.apiUrl}/admin/train-schedules/${scheduleId}`, schedule);
  }

  deleteSchedule(scheduleId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/train-schedules/${scheduleId}`);
  }

  getTrainSeats(scheduleId: number): Observable<TrainSeat[]> {
    return this.http.get<TrainSeat[]>(`${environment.apiUrl}/admin/train-seats/schedule/${scheduleId}`);
  }

  // TRAIN ROUTES (ADMIN)
  getRoutesByTrain(trainId: number): Observable<TrainRoute[]> {
    return this.http.get<TrainRoute[]>(`${environment.apiUrl}/admin/train-routes/train/${trainId}`);
  }

  addRoute(route: any): Observable<TrainRoute> {
    return this.http.post<TrainRoute>(`${environment.apiUrl}/admin/train-routes`, route);
  }

  updateRoute(id: number, route: any): Observable<TrainRoute> {
    return this.http.put<TrainRoute>(`${environment.apiUrl}/admin/train-routes/${id}`, route);
  }

  deleteRoute(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/train-routes/${id}`);
  }
}
