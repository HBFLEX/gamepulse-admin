import {inject, Injectable} from '@angular/core';
import { Observable } from 'rxjs';
import {
  UserDetailResponse,
  UserListResponse,
  User,
  CreateUserDto,
  UpdateUserDto
} from '../models/user-management.model';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserManagementApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/users`;

  getUsers(
    search?: string,
    isActive?: boolean,
    isVerified?: boolean,
    page: number = 1,
    limit: number = 20
  ): Observable<UserListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }
    if (isVerified !== undefined) {
      params = params.set('isVerified', isVerified.toString());
    }

    return this.http.get<UserListResponse>(this.apiUrl, { params });
  }

  getUserById(id: string): Observable<UserDetailResponse> {
    return this.http.get<UserDetailResponse>(`${this.apiUrl}/${id}`);
  }

  createUser(data: CreateUserDto): Observable<{ success: boolean; message: string; userId: string }> {
    return this.http.post<{ success: boolean; message: string; userId: string }>(this.apiUrl, data);
  }

  updateUser(
    id: string,
    data: UpdateUserDto
  ): Observable<{ success: boolean; message: string; user: User }> {
    return this.http.put<{ success: boolean; message: string; user: User }>(
      `${this.apiUrl}/${id}`,
      data
    );
  }

  deleteUser(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  toggleActive(
    id: string
  ): Observable<{
    success: boolean;
    message: string;
    user: { id: string; isActive: boolean; updatedAt: string };
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
      user: { id: string; isActive: boolean; updatedAt: string };
    }>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  toggleVerified(
    id: string
  ): Observable<{
    success: boolean;
    message: string;
    user: { id: string; isVerified: boolean; updatedAt: string };
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
      user: { id: string; isVerified: boolean; updatedAt: string };
    }>(`${this.apiUrl}/${id}/toggle-verified`, {});
  }
}