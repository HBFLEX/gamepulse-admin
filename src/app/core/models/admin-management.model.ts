export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  username: string;
  role: {
    id: number;
    role_name: string;
    permissions: string[];
  };
  team?: {
    id: number;
    team_name: string;
    team_city: string;
  } | null;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminListResponse {
  data: AdminUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface AdminDetailResponse {
  admin: AdminUser;
}

export interface CreateAdminDto {
  email: string;
  password: string;
  fullName: string;
  roleId: number;
  teamId?: number;
}

export interface UpdateAdminDto {
  fullName?: string;
  roleId?: number;
  teamId?: number;
  isActive?: boolean;
}

export interface AdminRole {
  id: number;
  role_name: string;
  permissions: string[];
}
