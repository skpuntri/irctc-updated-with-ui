import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="center">
      <div class="card">
        <div class="icon">🚫</div>
        <h2>Access Denied</h2>
        <p>You don't have permission to view this page.</p>
        <a routerLink="/" class="btn">← Go Home</a>
      </div>
    </div>
  `,
  styles: [`
    .center { display:flex; justify-content:center; align-items:center; min-height:60vh; }
    .card { background:white; border-radius:12px; padding:3rem; text-align:center; box-shadow:0 4px 20px rgba(0,0,0,0.1); }
    .icon { font-size:4rem; }
    h2 { color:#c62828; margin:1rem 0 0.5rem; }
    p { color:#555; margin-bottom:1.5rem; }
    .btn { background:#1a237e; color:white; padding:0.7rem 1.5rem; border-radius:6px; text-decoration:none; }
  `]
})
export class UnauthorizedComponent {}
