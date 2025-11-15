import {inject, Injectable} from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminDetailResponse,
  AdminListResponse,
  AdminUser,
  CreateAdminDto,
  UpdateAdminDto
} from '../models/admin-management.model';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminManagementApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  getAdmins(
    role?: string,
    isActive?: boolean,
    page: number = 1,
    limit: number = 20
  ): Observable<AdminListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (role) {
      params = params.set('role', role);
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<AdminListResponse>(this.apiUrl, { params });
  }

  getAdminById(id: string): Observable<AdminDetailResponse> {
    return this.http.get<AdminDetailResponse>(`${this.apiUrl}/${id}`);
  }

  createAdmin(data: CreateAdminDto): Observable<{ success: boolean; message: string; adminId: string }> {
    return this.http.post<{ success: boolean; message: string; adminId: string }>(this.apiUrl, data);
  }

  updateAdmin(
    id: string,
    data: UpdateAdminDto
  ): Observable<{ success: boolean; message: string; admin: AdminUser }> {
    return this.http.put<{ success: boolean; message: string; admin: AdminUser }>(
      `${this.apiUrl}/${id}`,
      data
    );
  }

  deleteAdmin(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  toggleActive(
    id: string
  ): Observable<{
    success: boolean;
    message: string;
    admin: { id: string; isActive: boolean; updatedAt: string };
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
      admin: { id: string; isActive: boolean; updatedAt: string };
    }>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  assignRole(
    id: string,
    roleId: number
  ): Observable<{ success: boolean; message: string; admin: Partial<AdminUser> }> {
    return this.http.put<{ success: boolean; message: string; admin: Partial<AdminUser> }>(
      `${this.apiUrl}/${id}/assign-role`,
      { roleId }
    );
  }

  assignTeam(
    id: string,
    teamId: number
  ): Observable<{ success: boolean; message: string; admin: Partial<AdminUser> }> {
    return this.http.put<{ success: boolean; message: string; admin: Partial<AdminUser> }>(
      `${this.apiUrl}/${id}/assign-team`,
      { teamId }
    );
  }
}
