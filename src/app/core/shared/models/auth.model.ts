export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AdminUser;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  avatar?: string;
  permissions: string[];
}

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  CONTENT_ADMIN = 'content_admin',
  GAME_ADMIN = 'game_admin',
  LEAGUE_ADMIN = 'league_admin',
  TEAM_ADMIN = 'team_admin',
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface AuthState {
  user: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
