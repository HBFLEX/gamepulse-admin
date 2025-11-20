export interface User {
  id: string;
  email: string;
  fullName: string;
  username?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  profile?: {
    avatar_url?: string;
    bio?: string;
    favorite_team_id?: number;
    favorite_team?: {
      id: number;
      name: string;
      city: string;
    };
    notifications_enabled: boolean;
    preferences?: Record<string, any>;
  };
}

export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  username?: string;
  favoriteTeamId?: number;
}

export interface UpdateUserDto {
  fullName?: string;
  username?: string;
  isActive?: boolean;
  favoriteTeamId?: number;
  avatar_url?: string;
  bio?: string;
  notifications_enabled?: boolean;
}

export interface UserListResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface UserDetailResponse {
  data: User;
}