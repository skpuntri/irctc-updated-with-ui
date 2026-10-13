import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="hero">
      <div class="hero-content">
        <h1>🚆 Book Train Tickets Instantly</h1>
        <p>Search trains, check availability, and book tickets seamlessly.</p>
        <div class="hero-actions">
          <a routerLink="/trains/search" class="btn btn-primary">🔍 Search Trains</a>
          <a routerLink="/auth/register" class="btn btn-outline">Get Started Free</a>
        </div>
      </div>
    </div>

    <div class="features-grid">
      <div class="feature-card">
        <span class="icon">🔍</span>
        <h3>Search Trains</h3>
        <p>Search available trains between any two stations on any date. No login required!</p>
        <a routerLink="/trains/search" class="link">Search now →</a>
      </div>
      <div class="feature-card">
        <span class="icon">🎫</span>
        <h3>Instant Booking</h3>
        <p>Book tickets in seconds with automatic seat assignment across AC, Sleeper, and General coaches.</p>
      </div>
      <div class="feature-card">
        <span class="icon">💳</span>
        <h3>Secure Payments</h3>
        <p>Pay securely via Razorpay. Your transaction data is always protected.</p>
      </div>
      <div class="feature-card">
        <span class="icon">📋</span>
        <h3>Manage Bookings</h3>
        <p>View all your bookings, download tickets, and cancel if needed — all in one place.</p>
      </div>
    </div>
  `,
  styles: [`
    .hero {
      background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%);
      color: white;
      padding: 5rem 2rem;
      text-align: center;
      border-radius: 12px;
      margin-bottom: 2.5rem;
    }
    .hero h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    .hero p { font-size: 1.2rem; opacity: 0.85; margin-bottom: 2rem; }
    .hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .btn {
      padding: 0.85rem 2rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
    .btn-primary { background: #ff6f00; color: white; }
    .btn-outline { background: transparent; color: white; border: 2px solid white; }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
    }
    .feature-card {
      background: white;
      border-radius: 10px;
      padding: 2rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      text-align: center;
    }
    .feature-card .icon { font-size: 2.5rem; }
    .feature-card h3 { margin: 0.75rem 0 0.5rem; color: #1a237e; }
    .feature-card p { color: #555; font-size: 0.9rem; line-height: 1.5; }
    .link { color: #ff6f00; font-weight: 600; text-decoration: none; }
  `]
})
export class HomeComponent {}
