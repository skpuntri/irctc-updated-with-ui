import { Routes } from '@angular/router';
import { authGuard, adminGuard, userGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // PUBLIC
  {
    path: '',
    loadComponent: () => import('./features/public/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'trains/search',
    loadComponent: () => import('./features/public/train-search/train-search.component').then(m => m.TrainSearchComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/public/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  // AUTH (guest only)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // USER routes (ROLE_NORMAL)
  {
    path: 'user',
    canActivate: [userGuard],
    children: [
      {
        path: 'bookings',
        loadComponent: () => import('./features/user/bookings/bookings.component').then(m => m.BookingsComponent)
      },
      {
        path: 'bookings/new',
        loadComponent: () => import('./features/user/new-booking/new-booking.component').then(m => m.NewBookingComponent)
      },
      {
        path: 'feedback',
        loadComponent: () => import('./features/user/feedback/feedback.component').then(m => m.FeedbackComponent)
      },
      { path: '', redirectTo: 'bookings', pathMatch: 'full' }
    ]
  },

  // ADMIN routes (ROLE_ADMIN)
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'trains',
        loadComponent: () => import('./features/admin/trains/trains.component').then(m => m.TrainsComponent)
      },
      {
        path: 'trains/:trainId/routes',
        loadComponent: () => import('./features/admin/train-routes/train-routes.component').then(m => m.TrainRoutesComponent)
      },
      {
        path: 'trains/:trainId/schedules',
        loadComponent: () => import('./features/admin/train-schedules/train-schedules.component').then(m => m.TrainSchedulesComponent)
      },
      {
        path: 'stations',
        loadComponent: () => import('./features/admin/stations/stations.component').then(m => m.StationsComponent)
      },
      {
        path: 'feedbacks',
        loadComponent: () => import('./features/admin/feedbacks/feedbacks.component').then(m => m.FeedbacksComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];
