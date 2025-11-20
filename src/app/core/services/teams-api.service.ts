import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface League {
  id: number;
  name: string;
  abbreviation?: string;
  country?: string;
  logo?: string;
}

export interface Division {
  id: number;
  name: string;
  leagueId: number;
}

export interface Conference {
  id: number;
  name: string;
  leagueId: number;
}

@Injectable({
  providedIn: 'root'
})
export class TeamsApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/teams`;

  getLeagues(): Observable<{ data: League[]; meta: { total: number } }> {
    return this.http.get<{ data: League[]; meta: { total: number } }>(
      `${this.apiUrl}/metadata/leagues`
    );
  }

  getDivisions(leagueId?: number): Observable<{ data: Division[]; meta: { total: number } }> {
    let url = `${this.apiUrl}/metadata/divisions`;
    if (leagueId) {
      url += `?leagueId=${leagueId}`;
    }
    return this.http.get<{ data: Division[]; meta: { total: number } }>(url);
  }

  getConferences(leagueId?: number): Observable<{ data: Conference[]; meta: { total: number } }> {
    let url = `${this.apiUrl}/metadata/conferences`;
    if (leagueId) {
      url += `?leagueId=${leagueId}`;
    }
    return this.http.get<{ data: Conference[]; meta: { total: number } }>(url);
  }
}
