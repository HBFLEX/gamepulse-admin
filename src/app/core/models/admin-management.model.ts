export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  username?: string;
  role: {
    id: number;
    name: string;
    permissions: string[];
  };
  team?: {
    id: number;
    name: string;
    city: string;
  } | null;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt?: string;
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
