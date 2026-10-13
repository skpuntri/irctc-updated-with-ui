import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2>🚆 Welcome Back</h2>
          <p>Login to your IRCTC account</p>
        </div>
        <form (ngSubmit)="login()" class="auth-form">
          <div class="form-group">
            <label>Email</label>
            <input [(ngModel)]="email" name="email" type="email" placeholder="you@example.com"
                   required class="form-control" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input [(ngModel)]="password" name="password" type="password" placeholder="••••••••"
                   required class="form-control" />
          </div>
          @if (error()) {
            <div class="alert alert-error">{{ error() }}</div>
          }
          <button type="submit" class="btn-submit" [disabled]="loading()">
            {{ loading() ? 'Logging in...' : 'Login' }}
          </button>
        </form>
        <div class="auth-footer">
          <p>Don't have an account? <a routerLink="/auth/register">Register here</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display:flex; justify-content:center; align-items:center; min-height:70vh; }
    .auth-card { background:white; border-radius:12px; padding:2.5rem; width:100%; max-width:420px; box-shadow:0 4px 24px rgba(0,0,0,0.1); }
    .auth-header { text-align:center; margin-bottom:2rem; }
    .auth-header h2 { color:#1a237e; font-size:1.8rem; }
    .auth-header p { color:#666; margin-top:0.25rem; }
    .auth-form { display:flex; flex-direction:column; gap:1.25rem; }
    .form-group { display:flex; flex-direction:column; gap:0.4rem; }
    .form-group label { font-size:0.85rem; font-weight:600; color:#333; }
    .form-control { padding:0.7rem 1rem; border:1px solid #ddd; border-radius:6px; font-size:0.95rem; outline:none; transition:border-color 0.2s; }
    .form-control:focus { border-color:#1a237e; }
    .alert { padding:0.75rem 1rem; border-radius:6px; font-size:0.9rem; }
    .alert-error { background:#ffebee; color:#c62828; }
    .btn-submit { padding:0.8rem; background:#1a237e; color:white; border:none; border-radius:6px; font-size:1rem; font-weight:600; cursor:pointer; transition:background 0.2s; }
    .btn-submit:hover:not(:disabled) { background:#283593; }
    .btn-submit:disabled { opacity:0.6; cursor:not-allowed; }
    .auth-footer { text-align:center; margin-top:1.5rem; color:#555; }
    .auth-footer a { color:#ff6f00; font-weight:600; text-decoration:none; }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  login(): void {
    this.loading.set(true);
    this.error.set('');
    this.authService.login({ username: this.email, password: this.password }).subscribe({
      next: res => {
        this.loading.set(false);
        const user = res.user;
        const isAdmin = user.roles?.some(r => r.name === 'ROLE_ADMIN');
        this.router.navigate([isAdmin ? '/admin/dashboard' : '/user/bookings']);
      },
      error: err => {
        this.error.set(err.error?.message || 'Invalid email or password.');
        this.loading.set(false);
      }
    });
  }
}
