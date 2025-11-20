import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Coach {
  id: number;
  coach_first_name: string;
  coach_last_name: string;
  coach_birth_date: string;
  coach_nationality: string;
  coach_experience_years: number;
  coach_created_at: string;
}

export interface CoachDetails extends Coach {
  full_name: string;
  age?: number;
  current_team?: {
    id: number;
    name: string;
    logo: string;
  };
}

export interface GetCoachesParams {
  search?: string;
  nationality?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CoachesApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/coaches`;

  getCoaches(params?: GetCoachesParams): Observable<{ 
    data: Coach[]; 
    pagination: { page: number; limit: number; total: number; totalPages: number } 
  }> {
    let url = this.apiUrl;
    const queryParams: string[] = [];

    if (params?.search) {
      queryParams.push(`search=${encodeURIComponent(params.search)}`);
    }
    if (params?.nationality) {
      queryParams.push(`nationality=${encodeURIComponent(params.nationality)}`);
    }
    if (params?.page) {
      queryParams.push(`page=${params.page}`);
    }
    if (params?.limit) {
      queryParams.push(`limit=${params.limit}`);
    }

    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    return this.http.get<{ 
      data: Coach[]; 
      pagination: { page: number; limit: number; total: number; totalPages: number } 
    }>(url);
  }

  getCoachDetails(id: number): Observable<CoachDetails> {
    return this.http.get<CoachDetails>(`${this.apiUrl}/${id}`);
  }

  getCoachTeamHistory(id: number): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${id}/history`);
  }
}
