import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <footer class="footer">
      <p>© 2025 IRCTC Clone — Built with Angular 21 + Spring Boot</p>
    </footer>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    .main-content { flex: 1; padding: 1.5rem 2rem; background: #f5f5f5; }
    .footer {
      background: #1a237e;
      color: rgba(255,255,255,0.7);
      text-align: center;
      padding: 1rem;
      font-size: 0.85rem;
    }
  `]
})
export class AppComponent {}
