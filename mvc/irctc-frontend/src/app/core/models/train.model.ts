export interface Station {
  id: number;
  code: string;
  name: string;
  city: string;
  state: string;
}

export interface Train {
  id: number;
  number: string;
  name: string;
  totalDistance: number;
  sourceStation: Station | null;
  destinationStation: Station | null;
}

export interface TrainSchedule {
  id: number;
  runDate: string;
  availableSeats: number;
  train: Train;
}

export interface TrainRoute {
  id: number;
  train: Train;
  station: Station;
  stationOrder: number;
  arrivalTime: string;
  departureTime: string;
  haltMinutes: number;
  distanceFromSource: number;
}

export interface TrainSeat {
  id: number;
  coachType: CoachType;
  totalSeats: number;
  availableSeats: number;
  price: number;
  trainSeatOrder: number;
}

export type CoachType = 'AC' | 'SLEEPER' | 'GENERAL';

export interface UserTrainSearchRequest {
  sourceStationId?: number;
  destinationStationId?: number;
  sourceStationCode?: string;
  destinationStationCode?: string;
  journeyDate: string;
}

export interface AvailableTrainResponse {
  trainId: number;
  trainNumber: string;
  trainName: string;
  sourceStation: Station | null;
  destinationStation: Station | null;
  departureTime: string;
  arrivalTime: string;
  scheduleDate?: string;
  journeyDate?: string;
  trainScheduleId?: number;
  seatsAvailable?: { [key in CoachType]?: number };
  priceByCoach?: { [key in CoachType]?: number };
  availableCoaches?: AvailableCoach[];
}

export interface AvailableCoach {
  coachType: CoachType;
  availableSeats: number;
  price: number;
}
