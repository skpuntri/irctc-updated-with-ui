import { Station } from './train.model';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'NOT_PAID';
export type CoachType = 'AC' | 'SLEEPER' | 'GENERAL';

export interface PassengerRequest {
  name: string;
  age: number;
  gender: string;
}

export interface BookingRequest {
  userId: number;
  trainScheduleId: number;
  sourceStationId: number;
  destinationStationId: number;
  coachType: CoachType;
  passengers: PassengerRequest[];
}

export interface PassengerResponse {
  name: string;
  age: number;
  gender: string;
  coachType: CoachType;
  seatNumber: string;
}

export interface BookingResponse {
  id: number;
  pnr: string;
  trainName: string;
  trainNumber: string;
  sourceStation: Station | null;
  destinationStation: Station | null;
  journeyDate: string;
  departureTime: string;
  arrivalTime: string;
  totalFare: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  passengers: PassengerResponse[];
  createdAt: string;
}

export interface FeedbackRequest {
  title: string;
  description: string;
  rating: number;
}

export interface FeedbackResponse {
  id: number;
  userId: number;
  userName: string;
  title: string;
  description: string;
  rating: number;
  createdAt: string;
  isArchived: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  lastPage: boolean;
}
