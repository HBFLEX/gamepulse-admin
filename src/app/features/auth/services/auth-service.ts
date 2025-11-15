import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  AdminUser,
  RefreshTokenResponse,
} from '../../../core/shared/models';
import { WebSocketService } from '../../../core/services/websocket.service';

const TOKEN_KEY = 'gp_access_token';
const REFRESH_TOKEN_KEY = 'gp_refresh_token';
const USER_KEY = 'gp_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly websocket = inject(WebSocketService);

  private readonly _user = signal<AdminUser | null>(this.getUserFromStorage());
  private readonly _accessToken = signal<string | null>(this.getTokenFromStorage());
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user() && !!this._accessToken());

  constructor() {
    if (this.isAuthenticated()) {
      const token = this._accessToken();
      if (token) {
        this.websocket.connect(token);
      }
    }
  }

  async login(credentials: LoginRequest): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const response = await this.http
        .post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
        .toPromise();

      if (response) {
        this.setAuthData(response);
      }
    } catch (error: any) {
      const errorMessage = error?.error?.message || 'Login failed. Please try again.';
      this._error.set(errorMessage);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        return false;
      }

      const response = await this.http
        .post<RefreshTokenResponse>(`${environment.apiUrl}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        .toPromise();

      if (response?.access_token) {
        this._accessToken.set(response.access_token);
        localStorage.setItem(TOKEN_KEY, response.access_token);

        // Reconnect WebSocket with new token
        this.websocket.disconnect();
        this.websocket.connect(response.access_token);

        return true;
      }

      return false;
    } catch {
      this.logout();
      return false;
    }
  }

  logout(): void {
    this.websocket.disconnect();
    this._user.set(null);
    this._accessToken.set(null);
    this._error.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.router.navigate(['/']);
  }

  private setAuthData(response: LoginResponse): void {
    this._user.set(response.user);
    this._accessToken.set(response.access_token);

    localStorage.setItem(TOKEN_KEY, response.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));

    this.websocket.connect(response.access_token);

    const dashboardRoute = this.getDashboardRoute(response.user.role);
    this.router.navigate([dashboardRoute]);
  }

  private getDashboardRoute(role: string): string {
    const roleRoutes: Record<string, string> = {
      'super_admin': '/super-admin',
      'content_admin': '/content-admin',
      'game_admin': '/game-admin',
      'league_admin': '/league-admin',
      'team_admin': '/team-admin',
    };
    return roleRoutes[role] || '/';
  }

  private getTokenFromStorage(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private getUserFromStorage(): AdminUser | null {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }
}
