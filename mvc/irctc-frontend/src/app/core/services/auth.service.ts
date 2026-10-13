import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { JwtResponse, LoginRequest, RegisterRequest, UserDto } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'irctc_access_token';
  private readonly REFRESH_TOKEN_KEY = 'irctc_refresh_token';
  private readonly USER_KEY = 'irctc_user';

  private _currentUser = signal<UserDto | null>(this.loadUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() =>
    this._currentUser()?.roles?.some(r => r.name === 'ROLE_ADMIN') ?? false
  );
  readonly isNormalUser = computed(() =>
    this._currentUser()?.roles?.some(r => r.name === 'ROLE_NORMAL') ?? false
  );

  constructor(private http: HttpClient, private router: Router) {}

  login(req: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${environment.apiUrl}/auth/login`, req).pipe(
      tap(res => this.storeSession(res))
    );
  }

  register(req: RegisterRequest): Observable<UserDto> {
    return this.http.post<UserDto>(`${environment.apiUrl}/auth/register`, req);
  }

  refreshToken(): Observable<JwtResponse> {
    const refreshToken = this.getRefreshToken() || '';
    return this.http
      .post<JwtResponse>(`${environment.apiUrl}/auth/refresh-token`, refreshToken, {
        headers: { 'Content-Type': 'text/plain' }
      })
      .pipe(tap(res => this.storeSession(res)));
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private storeSession(res: JwtResponse): void {
    const accessToken = res.token || res.accessToken || '';
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this._currentUser.set(res.user);
  }

  private loadUser(): UserDto | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
