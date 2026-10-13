import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <a routerLink="/" class="brand-logo">🚆 IRCTC</a>
      </div>

      <div class="navbar-links">
        <!-- PUBLIC links -->
        <a routerLink="/trains/search" routerLinkActive="active">🔍 Search Trains</a>

        @if (!auth.isLoggedIn()) {
          <a routerLink="/auth/login" routerLinkActive="active">Login</a>
          <a routerLink="/auth/register" routerLinkActive="active" class="btn-primary">Register</a>
        }

        <!-- NORMAL USER links -->
        @if (auth.isNormalUser()) {
          <a routerLink="/user/bookings" routerLinkActive="active">🎫 My Bookings</a>
          <a routerLink="/user/bookings/new" routerLinkActive="active">+ Book Ticket</a>
          <a routerLink="/user/feedback" routerLinkActive="active">💬 Feedback</a>
        }

        <!-- ADMIN links -->
        @if (auth.isAdmin()) {
          <a routerLink="/admin/dashboard" routerLinkActive="active">📊 Dashboard</a>
          <a routerLink="/admin/trains" routerLinkActive="active">🚂 Trains</a>
          <a routerLink="/admin/stations" routerLinkActive="active">🏢 Stations</a>
          <a routerLink="/admin/feedbacks" routerLinkActive="active">💬 Feedbacks</a>
        }

        <!-- USER info + logout -->
        @if (auth.isLoggedIn()) {
          <span class="user-chip">
            {{ auth.isAdmin() ? '🛡️' : '👤' }} {{ auth.currentUser()?.name }}
          </span>
          <button class="btn-danger" (click)="auth.logout()">Logout</button>
        }
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 2rem;
      background: #1a237e;
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .brand-logo {
      font-size: 1.4rem;
      font-weight: 700;
      color: white;
      text-decoration: none;
      letter-spacing: 1px;
    }
    .navbar-links {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .navbar-links a {
      color: rgba(255,255,255,0.85);
      text-decoration: none;
      font-size: 0.9rem;
      padding: 0.4rem 0.75rem;
      border-radius: 4px;
      transition: background 0.2s;
    }
    .navbar-links a:hover, .navbar-links a.active {
      background: rgba(255,255,255,0.15);
      color: white;
    }
    .btn-primary {
      background: #ff6f00 !important;
      color: white !important;
      font-weight: 600;
    }
    .btn-danger {
      background: #c62828;
      color: white;
      border: none;
      padding: 0.4rem 0.9rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .btn-danger:hover { background: #b71c1c; }
    .user-chip {
      background: rgba(255,255,255,0.1);
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
    }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
}
