import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2>🚆 Create Account</h2>
          <p>Join IRCTC and start booking tickets</p>
        </div>
        <form (ngSubmit)="register()" class="auth-form">
          <div class="form-group">
            <label>Full Name</label>
            <input [(ngModel)]="form.name" name="name" placeholder="Your Name" required class="form-control" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input [(ngModel)]="form.email" name="email" type="email" placeholder="you@example.com" required class="form-control" />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input [(ngModel)]="form.phone" name="phone" type="tel" placeholder="10-digit mobile number" required class="form-control" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input [(ngModel)]="form.password" name="password" type="password" placeholder="Min 8 characters" required class="form-control" />
          </div>
          @if (error()) {
            <div class="alert alert-error">{{ error() }}</div>
          }
          @if (success()) {
            <div class="alert alert-success">✅ Account created! Redirecting to login...</div>
          }
          <button type="submit" class="btn-submit" [disabled]="loading()">
            {{ loading() ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>
        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/auth/login">Login here</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display:flex; justify-content:center; align-items:center; min-height:70vh; }
    .auth-card { background:white; border-radius:12px; padding:2.5rem; width:100%; max-width:440px; box-shadow:0 4px 24px rgba(0,0,0,0.1); }
    .auth-header { text-align:center; margin-bottom:2rem; }
    .auth-header h2 { color:#1a237e; font-size:1.8rem; }
    .auth-header p { color:#666; }
    .auth-form { display:flex; flex-direction:column; gap:1.1rem; }
    .form-group { display:flex; flex-direction:column; gap:0.4rem; }
    .form-group label { font-size:0.85rem; font-weight:600; color:#333; }
    .form-control { padding:0.7rem 1rem; border:1px solid #ddd; border-radius:6px; font-size:0.95rem; outline:none; }
    .form-control:focus { border-color:#1a237e; }
    .alert { padding:0.75rem 1rem; border-radius:6px; font-size:0.9rem; }
    .alert-error { background:#ffebee; color:#c62828; }
    .alert-success { background:#e8f5e9; color:#2e7d32; }
    .btn-submit { padding:0.8rem; background:#ff6f00; color:white; border:none; border-radius:6px; font-size:1rem; font-weight:600; cursor:pointer; }
    .btn-submit:disabled { opacity:0.6; cursor:not-allowed; }
    .auth-footer { text-align:center; margin-top:1.5rem; color:#555; }
    .auth-footer a { color:#1a237e; font-weight:600; text-decoration:none; }
  `]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  form = { name: '', email: '', phone: '', password: '' };
  loading = signal(false);
  error = signal('');
  success = signal(false);

  register(): void {
    this.loading.set(true);
    this.error.set('');
    this.authService.register(this.form).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      error: err => {
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
